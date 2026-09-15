"""Guards that keep conversation history from blowing up the model context.

Two independent hazards:

1. **Inline image payloads.** The graphic tools intentionally stash the real
   base64 image outside the model context (see `_generated_images` in
   `agents/graphic_design/graphic_desiger_tools.py`) and hand the LLM a small
   `image_token`. That protection is lost once a `data:image/png;base64,…`
   URL gets persisted in `chat_messages` and replayed as prompt text on the
   next turn — a single 2400x2400 PNG is ~1.6 MB of base64 (~400k tokens),
   which exceeds the model's window and fails the whole request.
2. **Long sessions.** History grows without bound: every assistant turn in
   this product can be a multi-thousand-token report.

`guard_history()` neutralizes both before the rows ever reach the model.
Persistence-side protection lives in `safe_image_reference()`.
"""

import logging
import re

logger = logging.getLogger(__name__)

# Marker left in place of an inline image, so the model still reads the turn
# as "a graphic was produced here" without the payload.
INLINE_IMAGE_MARKER = "[image]"

# A single history message longer than this is clipped (≈5k tokens).
MAX_MESSAGE_CHARS = 20_000

# Total history handed to the model (≈30k tokens of the 131k window, leaving
# room for the system prompt, tool schemas, memories and RAG context).
MAX_HISTORY_CHARS = 120_000

# Inline images larger than this are never written into a chat message.
MAX_INLINE_PERSIST_CHARS = 32_000

_BASE64_DATA_URL_RE = re.compile(r"data:image/[\w.+-]+;base64,[A-Za-z0-9+/=]+")
_PLAIN_DATA_URL_RE = re.compile(r"data:image/[\w.+-]+(?:;[\w.+-]+=[\w.+-]*)*,[^\s)\]]+")

# Our own object storage (signed or public URLs).
_STORAGE_URL_GLOBAL_RE = re.compile(r"https?://[^\s)\]]*/storage/v1/object/[^\s)\]]*")
_STORAGE_MARKDOWN_RE = re.compile(r"!?\[[^\[\]\n]*\]\(\s*<?([^)\s>]+)>?\s*\)")
_IMAGE_MARKER_RE = re.compile(r"\[image:[^\]\n]*\]?", re.IGNORECASE)


def _is_storage_url(url: str) -> bool:
    return "/storage/v1/object/" in (url or "")


def strip_storage_urls(text: str) -> str:
    """Remove references to our own storage objects from assistant text.

    The CEO sometimes echoes the signed URL of the graphic it just produced
    (occasionally as markdown), which is unreadable for the founder and useless
    to the model — the UI renders the image itself.

    Only *our* storage URLs are touched; the caption's own links (research
    sources, the founder's website) are left alone.
    """
    if not text or "/storage/v1/object/" not in text:
        return text

    out = _STORAGE_MARKDOWN_RE.sub(
        lambda m: "" if _is_storage_url(m.group(1)) else m.group(0),
        text,
    )
    out = _IMAGE_MARKER_RE.sub("", out)
    out = _STORAGE_URL_GLOBAL_RE.sub("", out)
    return re.sub(r"\n{3,}", "\n\n", out).strip()



def strip_inline_images(text: str) -> str:
    """Replace inline `data:image/...` payloads with a short marker."""
    if not text or "data:image" not in text:
        return text
    cleaned = _BASE64_DATA_URL_RE.sub(INLINE_IMAGE_MARKER, text)
    cleaned = _PLAIN_DATA_URL_RE.sub(INLINE_IMAGE_MARKER, cleaned)
    if cleaned != text:
        logger.info("Stripped inline image data from text (%d -> %d chars)", len(text), len(cleaned))
    return cleaned


def safe_image_reference(image_url: str | None, max_inline_chars: int = MAX_INLINE_PERSIST_CHARS) -> str | None:
    """Return an image reference that is safe to persist in a chat message.

    External URLs are always fine. Inline `data:` URLs are only kept while they
    are small; anything larger returns None so the caller stores the text
    without an image reference (rather than a megabyte of base64).
    """
    if not image_url:
        return None
    if not image_url.startswith("data:"):
        return image_url
    if len(image_url) <= max_inline_chars:
        return image_url
    logger.warning(
        "Refusing to persist an inline image of %d chars in a chat message — dropping the reference",
        len(image_url),
    )
    return None


def guard_history(
    history: list[dict] | None,
    *,
    max_message_chars: int = MAX_MESSAGE_CHARS,
    max_total_chars: int = MAX_HISTORY_CHARS,
) -> list[dict]:
    """Return history rows that are safe to send to the model.

    Newest messages are kept; the oldest ones are dropped once the total budget
    is reached. Inline images are stripped and oversized messages clipped.
    """
    if not history:
        return []

    kept: list[dict] = []
    total = 0
    dropped = 0
    for turn in reversed(history):  # newest first
        content = strip_inline_images((turn.get("content") or turn.get("message") or "")).strip()
        if not content:
            continue
        if len(content) > max_message_chars:
            content = content[:max_message_chars] + "\n…[truncated]"
        if kept and total + len(content) > max_total_chars:
            dropped += 1
            continue
        kept.append({"role": turn.get("role"), "content": content, "message": content})
        total += len(content)

    if dropped:
        logger.warning(
            "History exceeded %d chars — dropped %d older message(s), kept %d (~%d chars)",
            max_total_chars, dropped, len(kept), total,
        )
    return list(reversed(kept))

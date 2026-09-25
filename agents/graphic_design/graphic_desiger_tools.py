import base64
import io
import json
import logging
import os
import uuid

import requests
from dotenv import load_dotenv
from langchain.tools import tool

from agents.helpers.utils import base64_to_img

load_dotenv()
logger = logging.getLogger(__name__)

# Module-level cache so the heavy base64 image never enters LLM context.
# Keyed by a token returned to the LLM; the caller retrieves the real
# data URL via get_generated_image().
_generated_images: dict[str, str] = {}

MODEL_ALIASES = {
    "google/gemini-2.5-flash-image": "google/gemini-2.5-flash-image",
    "gemini": "google/gemini-2.5-flash-image",
    "gemini-2.5-flash": "google/gemini-2.5-flash-image",
    "google/gemini-2.5-flash": "google/gemini-2.5-flash-image",
    "openai/gpt-image-2": "openai/gpt-image-2",
    "gpt-image-2": "openai/gpt-image-2",
    "gpt-image": "openai/gpt-image-2",
    "openai/gpt-image": "openai/gpt-image-2",
}


def get_generated_image(token: str) -> str | None:
    """Retrieve and remove a cached image data URL by token (one-shot read)."""
    return _generated_images.pop(token, None)


def has_generated_image(token: str) -> bool:
    """Check whether a cached image exists without removing it."""
    return token in _generated_images


def peek_generated_image(token: str) -> str | None:
    """Read a cached image data URL without removing it (unlike get_generated_image)."""
    return _generated_images.get(token)


# ── Company logo as an image reference ───────────────────────────────────────
# When the company has a logo in its Drive, it is fetched *here* and handed
# straight to the image model as a reference image. The encoded bytes never
# leave this process — they are not part of the tool's return value, so they can
# never end up in the LLM's context window (same principle as _generated_images).

_LOGO_REFERENCE_INSTRUCTION = (
    "REFERENCE IMAGE PROVIDED: the attached image is THIS company's official logo. "
    "Use that exact logo as the brand mark inside the generated visual — place it naturally "
    "on the packaging, label, or as the brand signature in the composition, keeping it legible, "
    "undistorted and faithful to the reference. This company logo is explicitly allowed and expected. "
    "The rule about third-party branding still applies: no other brand logos, trademarks or watermarks."
)

# Endpoints that do not accept reference images answer with one of these.
_REFERENCE_REJECT_STATUS = (400, 404, 413, 422)

# Longest edge of the reference copy we send. The stored logo is never touched —
# only the copy handed to the model, so a multi-MB PNG cannot turn into a
# multi-MB JSON body.
_REFERENCE_MAX_EDGE = 768


def _sniff_image_mime(content: bytes) -> str:
    """Best-effort MIME detection so the data URL matches the actual bytes."""
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
        return "image/webp"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    return "image/png"


def _shrink_for_reference(content: bytes) -> bytes:
    """Downscale a logo for use as a model reference image.

    Falls back to the original bytes when Pillow is missing, the image cannot be
    decoded, or shrinking would not actually help — a cosmetic step must never
    block image generation.
    """
    try:
        from PIL import Image
    except ImportError:  # pragma: no cover - Pillow is in requirements.txt
        return content

    try:
        with Image.open(io.BytesIO(content)) as image:
            image.load()
            if max(image.size) <= _REFERENCE_MAX_EDGE:
                return content
            image.thumbnail((_REFERENCE_MAX_EDGE, _REFERENCE_MAX_EDGE), Image.LANCZOS)
            converted = image.convert("RGBA") if image.mode in ("RGBA", "LA", "P") else image.convert("RGB")
            buffer = io.BytesIO()
            converted.save(buffer, format="PNG", optimize=True)
            shrunk = buffer.getvalue()
    except Exception:
        logger.warning("Could not downscale the logo — sending it as stored")
        return content

    return shrunk if len(shrunk) < len(content) else content


def _logo_candidate_paths(company_id: int, record: dict, default_name: str) -> list[str]:
    """Storage keys to try for a logo row, in order.

    The canonical logo row stores the bare name (`storage_path == "logo.png"`)
    while the object actually lives at `{company_id}/logo.png`, so the stored
    value cannot be used verbatim. Hand uploads may store a full path.
    """
    candidates: list[str] = []
    stored = (record.get("storage_path") or "").strip()
    if stored:
        candidates.append(stored if "/" in stored else f"{company_id}/{stored}")
    for name in (record.get("file_name"), record.get("original_file_name"), default_name):
        if name:
            full = f"{company_id}/{name}"
            if full not in candidates:
                candidates.append(full)
    return candidates


def get_company_logo_data_url(company_id: int) -> str | None:
    """Return the company logo as a base64 data URL, or None when it has none.

    Lookup failures are swallowed on purpose: a missing or unreadable logo must
    never stop a graphic from being generated.
    """
    try:
        from backend.db.get_from_sql import get_company_logo
        from backend.db.put_to_drive import download_from_cloud
        from backend.logo import LOGO_BUCKET, LOGO_FILE_NAME

        record = get_company_logo(company_id)
        if not record:
            logger.info(
                "No company logo found — company_id=%s (generating without a brand mark)",
                company_id,
            )
            return None

        bucket = record.get("bucket_name") or LOGO_BUCKET
        content = None
        for path in _logo_candidate_paths(company_id, record, LOGO_FILE_NAME):
            content = download_from_cloud(
                company_id,
                file_name=record.get("file_name") or LOGO_FILE_NAME,
                bucket_name=bucket,
                storage_path=path,
            )
            if content:
                break
    except Exception:
        logger.exception("Company logo lookup failed — company_id=%s", company_id)
        return None

    if not content:
        logger.warning("Company logo download returned no data — company_id=%s", company_id)
        return None

    reference = _shrink_for_reference(content)
    mime_type = _sniff_image_mime(reference)
    logger.info(
        "Attaching company logo as an image reference — company_id=%s, %d bytes (%d stored), %s",
        company_id,
        len(reference),
        len(content),
        mime_type,
    )
    return f"data:{mime_type};base64,{base64.b64encode(reference).decode('ascii')}"


def _post_image_request(api_key: str, payload: dict):
    """POST to the OpenRouter image endpoint (kept separate so we can retry)."""
    return requests.post(
        "https://openrouter.ai/api/v1/images",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )


@tool("create_graphic", description="Create a graphic from a prompt and return it as a data URL.")
def create_graphic(company_id: int, prompt: str, model: str = "google/gemini-2.5-flash-image"):
    """Generate a graphic for immediate display; persistence is handled by the chat API."""
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("A non-empty image prompt is required")

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        raise RuntimeError("LLM_API_KEY is not configured for image generation")

    target_model = MODEL_ALIASES.get(model.strip().lower(), model.strip()) if isinstance(model, str) else "google/gemini-2.5-flash-image"
    if target_model not in MODEL_ALIASES.values():
        target_model = "google/gemini-2.5-flash-image"

    # Enforce unbranded safeguard so image models do not hallucinate real-world commercial brand logos
    clean_prompt = prompt.strip()
    anti_logo_directive = "Clean unbranded presentation, strictly no third-party brand logos, commercial brand names, trademarks, brand emblems, or watermarks."
    if "no third-party logo" not in clean_prompt.lower() and "unbranded" not in clean_prompt.lower() and "no logo" not in clean_prompt.lower():
        clean_prompt = f"{clean_prompt}. {anti_logo_directive}"

    # Brand mark: when the founder has a logo in the company Drive it is attached
    # here as a reference image. The base64 stays inside this call — the LLM only
    # ever sees the prompt it wrote and the token we return below.
    try:
        logo_company_id: int | None = int(company_id)
    except (TypeError, ValueError):
        logger.warning("create_graphic received a non-numeric company_id=%r — skipping logo lookup", company_id)
        logo_company_id = None

    logo_reference = get_company_logo_data_url(logo_company_id) if logo_company_id is not None else None

    logger.info("create_graphic called with model=%s (resolved from %s)", target_model, model)
    payload = {
        "model": target_model,
        "prompt": f"{clean_prompt}\n\n{_LOGO_REFERENCE_INSTRUCTION}" if logo_reference else clean_prompt,
    }
    if logo_reference:
        payload["input_references"] = [
            {"type": "image_url", "image_url": {"url": logo_reference}}
        ]

    resp = _post_image_request(api_key, payload)

    # Some endpoints reject `input_references` outright. A rejected brand mark
    # must never cost the founder their graphic — retry once without it.
    if logo_reference and resp.status_code in _REFERENCE_REJECT_STATUS:
        logger.warning(
            "Image model %s rejected input_references (%s) — retrying without the company logo",
            target_model,
            resp.status_code,
        )
        payload.pop("input_references", None)
        payload["prompt"] = clean_prompt
        resp = _post_image_request(api_key, payload)

    if not resp.ok:
        logger.error("OpenRouter image generation failed (%s): %s", resp.status_code, resp.text)
        resp.raise_for_status()

    try:
        res_json = resp.json()
        data = res_json.get("data", [])
        if not data or not isinstance(data, list):
            raise RuntimeError(f"Image provider returned no data items: {res_json}")

        first_item = data[0]
        image_bytes = None
        if isinstance(first_item, dict):
            if first_item.get("b64_json"):
                image_bytes = base64_to_img(first_item["b64_json"])
            elif first_item.get("url"):
                url_val = first_item["url"]
                if url_val.startswith("data:"):
                    image_bytes = base64_to_img(url_val)
                else:
                    img_res = requests.get(url_val, timeout=60)
                    img_res.raise_for_status()
                    image_bytes = img_res.content
            elif first_item.get("image_url", {}).get("url"):
                url_val = first_item["image_url"]["url"]
                if url_val.startswith("data:"):
                    image_bytes = base64_to_img(url_val)
                else:
                    img_res = requests.get(url_val, timeout=60)
                    img_res.raise_for_status()
                    image_bytes = img_res.content

        if not image_bytes:
            raise RuntimeError(f"Image provider returned no valid image in data: {first_item}")

    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise RuntimeError(f"Image provider returned invalid image data: {exc}") from exc

    media_type = first_item.get("media_type") if isinstance(first_item, dict) else None
    if media_type:
        mime_type = media_type
    elif image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        mime_type = "image/png"
    elif image_bytes.startswith(b"\xff\xd8\xff"):
        mime_type = "image/jpeg"
    elif image_bytes.startswith(b"RIFF") and len(image_bytes) >= 12 and image_bytes[8:12] == b"WEBP":
        mime_type = "image/webp"
    else:
        mime_type = "image/png"

    logger.info("Graphic created successfully, size: %d bytes, mime_type: %s", len(image_bytes), mime_type)
    image_data_url = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"

    # Stash the real image and return a tiny placeholder to the LLM so the
    # ~1MB base64 string never bloats the model's context window.
    token = uuid.uuid4().hex
    _generated_images[token] = image_data_url
    return json.dumps({"image_token": token, "mime_type": mime_type, "status": "Graphic generated successfully."})

@tool('get_color_palette', description="Fetch the current active color palette (name + hex array) for the brand.")
def get_color_palette(company_id: int):
    """Fetch the current active color palette for the given company."""
    logger.info("get_color_palette called: company_id=%d", company_id)
    from backend.utils import get_supabase_client
    client = get_supabase_client()
    response = (
        client.table("color_palettes")
        .select("*")
        .eq("company_id", company_id)
        .eq("is_active", True)
        .execute()
    )
    result = response.data[0] if response.data else {"palette": None, "message": "No active palette set"}
    logger.info("Color palette retrieved for company_id=%d: %s", company_id, result)
    return result


@tool
def update_color_palette(company_id: int, new_colors: list[str]):
    """Update (or create) the active color palette for a company with the given hex values."""
    logger.info("update_color_palette called: company_id=%d, colors=%s", company_id, new_colors)
    from backend.utils import get_supabase_client
    from datetime import datetime, timezone
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()

    existing = (
        client.table("color_palettes")
        .select("id")
        .eq("company_id", company_id)
        .eq("is_active", True)
        .execute()
    )

    if existing.data:
        response = (
            client.table("color_palettes")
            .update({"palette": new_colors, "updated_at": now})
            .eq("id", existing.data[0]["id"])
            .execute()
        )
    else:
        response = (
            client.table("color_palettes")
            .insert({
                "company_id": company_id,
                "name": "Default",
                "palette": new_colors,
                "is_active": True,
            })
            .execute()
        )

    result = response.data[0] if response.data else {"error": "Failed to update color palette"}
    logger.info("Color palette updated for company_id=%d", company_id)
    return result

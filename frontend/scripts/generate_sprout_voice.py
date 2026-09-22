#!/usr/bin/env python3
"""Generate Sprout's voice-over clips with Gemini TTS.

Reads the clip list from `public/voice/sprout/manifest.json` (itself generated
from `src/components/demo/sproutVoice.ts`) and writes `sprout-<key>.mp3` files
into `public/voice/sprout/`, which is exactly where the demo bot looks for them.

Usage (from `frontend/`):

    python scripts/generate_sprout_voice.py                    # all missing clips
    python scripts/generate_sprout_voice.py --voice Puck       # another voice
    python scripts/generate_sprout_voice.py --only home-1 chats-1
    python scripts/generate_sprout_voice.py --force            # re-record everything
    python scripts/generate_sprout_voice.py --list-voices

The API key is read from `GOOGLE_TTS_API_KEY` (falls back to the repo-root
`.env`, which is gitignored). Never hard-code it here.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-3.1-flash-tts-preview"
# Model used by --verify to transcribe a clip back to text (audio understanding).
DEFAULT_QA_MODEL = "gemini-flash-latest"
DEFAULT_VOICE = "Aoede"
# Short direction prepended to every line. Keeps the delivery warm instead of
# flat, without turning into a paragraph the model might read out loud.
STYLE_PREFIX = "Say warmly and clearly, like a friendly product guide: "

# A small, curated slice of Gemini's prebuilt voices — enough to pick a tone.
VOICES = [
    ("Aoede", "breezy, youthful — default for a cute guide bot"),
    ("Puck", "upbeat, energetic"),
    ("Leda", "youthful, light"),
    ("Kore", "firm, neutral"),
    ("Charis", "warm, gentle"),
    ("Enceladus", "breathy, calm"),
    ("Zephyr", "bright, clear"),
    ("Orus", "confident, informative"),
]

FRONTEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = FRONTEND_DIR.parent
OUT_DIR = FRONTEND_DIR / "public" / "voice" / "sprout"
MANIFEST = OUT_DIR / "manifest.json"


class DailyQuotaExceeded(RuntimeError):
    """The free tier allows a handful of TTS requests per model per day."""


def _retry_delay(error: urllib.error.HTTPError, detail: str, fallback: float) -> float:
    """Seconds to wait before retrying a 429, taken from the API when present."""
    try:
        payload = json.loads(detail)
    except ValueError:
        return fallback
    for item in payload.get("error", {}).get("details", []):
        if "RetryInfo" in item.get("@type", ""):
            try:
                return float(str(item.get("retryDelay", "")).rstrip("s")) or fallback
            except ValueError:
                return fallback
    return fallback


def _is_daily_quota(detail: str) -> bool:
    return "PerDay" in detail


def load_api_key() -> str:
    key = os.environ.get("GOOGLE_TTS_API_KEY", "").strip()
    if key:
        return key
    env_file = REPO_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("GOOGLE_TTS_API_KEY="):
                return line.split("=", 1)[1].strip()
    sys.exit(
        "GOOGLE_TTS_API_KEY is not set. Add it to the repo-root .env "
        "(gitignored) or export it before running this script."
    )


def load_clips() -> list[dict]:
    if not MANIFEST.exists():
        sys.exit(
            f"{MANIFEST.relative_to(REPO_ROOT)} is missing — run "
            "`node scripts/gen-sprout-voice-manifest.js` first."
        )
    return json.loads(MANIFEST.read_text())["clips"]


def synthesize(api_key: str, model: str, voice: str, text: str, retries: int = 4) -> bytes:
    """Return raw 16-bit PCM audio for one line."""
    payload = {
        "contents": [{"parts": [{"text": f"{STYLE_PREFIX}{text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    }
    request = urllib.request.Request(
        f"{API_ROOT}/{model}:generateContent",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        method="POST",
    )

    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=240) as response:
                body = json.loads(response.read())
            break
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            if error.code == 429 and _is_daily_quota(detail):
                raise DailyQuotaExceeded(
                    f"model {model} allows 10 requests per day on the free tier"
                )
            if error.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                wait = _retry_delay(error, detail, 2 ** attempt * 2)
                print(f"    {error.code} — retrying in {wait:.0f}s")
                time.sleep(wait)
                continue
            raise SystemExit(f"TTS request failed ({error.code}): {detail[:400]}")
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            reason = getattr(error, "reason", None) or type(error).__name__
            if attempt < retries - 1:
                wait = 2 ** attempt * 2
                print(f"    {reason} — retrying in {wait}s")
                time.sleep(wait)
                continue
            raise SystemExit(f"TTS request failed: {reason}")
    else:  # pragma: no cover - loop always breaks or exits
        raise SystemExit("TTS request failed after retries")

    try:
        part = body["candidates"][0]["content"]["parts"][0]["inlineData"]
        return base64.b64decode(part["data"])
    except (KeyError, IndexError):
        raise SystemExit(f"Unexpected TTS response: {json.dumps(body)[:400]}")


def pcm_to_mp3(pcm: bytes, destination: Path, sample_rate: int = 24000) -> None:
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg is required to encode the mp3 files.")
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-f", "s16le",
        "-ar", str(sample_rate),
        "-ac", "1",
        "-i", "pipe:0",
        "-ac", "1",
        "-ar", "44100",
        "-b:a", "96k",
        "-y",
        str(destination),
    ]
    process = subprocess.run(command, input=pcm, capture_output=True)
    if process.returncode != 0:
        raise SystemExit(f"ffmpeg failed: {process.stderr.decode(errors='replace')[:300]}")


def duration_of(path: Path) -> float:
    try:
        out = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "csv=p=0", str(path),
            ],
            capture_output=True,
            text=True,
        )
        return float(out.stdout.strip())
    except (ValueError, FileNotFoundError):
        return 0.0


def transcribe(
    api_key: str,
    path: Path,
    model: str = DEFAULT_QA_MODEL,
    question: str = (
        "Reply with only a verbatim transcript of this audio. No commentary, no quotes."
    ),
) -> str:
    """QA helper: ask Gemini what it hears in a generated clip."""
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "audio/mp3",
                            "data": base64.b64encode(path.read_bytes()).decode(),
                        }
                    },
                    {"text": question},
                ]
            }
        ]
    }
    request = urllib.request.Request(
        f"{API_ROOT}/{model}:generateContent",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        method="POST",
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                body = json.loads(response.read())
            break
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt * 2)
                continue
            return f"<HTTP {error.code}: {error.read().decode(errors='replace')[:160]}>"
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            reason = getattr(error, "reason", None) or type(error).__name__
            if attempt < 3:
                time.sleep(2 ** attempt * 2)
                continue
            return f"<network error: {reason}>"
    else:  # pragma: no cover
        return "<no response>"
    try:
        return body["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        return f"<unexpected response: {json.dumps(body)[:200]}>"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Sprout's voice-over clips.")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"prebuilt voice name (default {DEFAULT_VOICE})")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"TTS model (default {DEFAULT_MODEL})")
    parser.add_argument("--only", nargs="*", help="clip keys or file names to generate")
    parser.add_argument("--force", action="store_true", help="overwrite clips that already exist")
    parser.add_argument("--delay", type=float, default=1.0, help="pause between requests, seconds")
    parser.add_argument(
        "--limit",
        type=int,
        help="stop after this many clips in this run (protects a small API budget)",
    )
    parser.add_argument("--list-voices", action="store_true", help="show the curated voice list and exit")
    parser.add_argument(
        "--samples",
        metavar="KEY",
        help="record one line in several voices into samples/ so a tone can be picked",
    )
    parser.add_argument("--verify", nargs="*", help="transcribe generated clips back to text for QA")
    parser.add_argument("--ask", help="custom QA question about the clip given with --verify")
    args = parser.parse_args()

    if args.list_voices:
        for name, description in VOICES:
            print(f"  {name:<12} {description}")
        return 0

    if args.samples:
        api_key = load_api_key()
        clips = load_clips()
        key = args.samples[:-4] if args.samples.endswith(".mp3") else args.samples
        key = key.replace("sprout-", "")
        clip = next((item for item in clips if item["key"] == key), None)
        if clip is None:
            sys.exit(f"Unknown clip key {key!r}")
        sample_dir = OUT_DIR / "samples"
        sample_dir.mkdir(parents=True, exist_ok=True)
        print(f"Recording {clip['file']} in {len(VOICES)} voices into samples/\n")
        for name, description in VOICES:
            target = sample_dir / f"{name.lower()}.mp3"
            pcm = synthesize(api_key, args.model, name, clip["text"])
            pcm_to_mp3(pcm, target)
            print(f"  {name:<12} {duration_of(target):5.1f}s  {description}")
            time.sleep(args.delay)
        print(f"\nListen to samples/ and re-record everything with, e.g.:\n"
              f"  python scripts/generate_sprout_voice.py --force --voice Puck")
        return 0

    if args.verify is not None:
        api_key = load_api_key()
        names = args.verify or [clip["file"] for clip in load_clips()]
        for name in names:
            file = name if name.endswith(".mp3") else f"sprout-{name}.mp3"
            path = OUT_DIR / file
            if not path.exists():
                print(f"{file}: missing")
                continue
            print(f"{file}\n  heard: {transcribe(api_key, path, question=args.ask)}" if args.ask else f"{file}\n  heard: {transcribe(api_key, path)}")
        return 0

    api_key = load_api_key()
    clips = load_clips()

    if args.only:
        wanted = {item if item.endswith(".mp3") else f"sprout-{item}.mp3" for item in args.only}
        clips = [clip for clip in clips if clip["file"] in wanted]
        if not clips:
            sys.exit(f"No clips matched {sorted(wanted)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = [clip for clip in clips if args.force or not (OUT_DIR / clip["file"]).exists()]
    skipped = len(clips) - len(todo)
    budget = args.limit if args.limit and args.limit > 0 else None
    if budget is not None and len(todo) > budget:
        print(f"Limiting this run to {budget} clip(s) (--limit); {len(todo) - budget} left for later.")
        todo = todo[:budget]
    print(
        f"Voice: {args.voice} · model: {args.model}\n"
        f"{len(todo)} clip(s) to generate"
        + (f", {skipped} already present" if skipped else "")
        + f"\nOutput: {OUT_DIR.relative_to(REPO_ROOT)}\n"
    )

    for index, clip in enumerate(todo, start=1):
        target = OUT_DIR / clip["file"]
        print(f"[{index}/{len(todo)}] {clip['file']}")
        started = time.time()
        try:
            pcm = synthesize(api_key, args.model, args.voice, clip["text"])
        except DailyQuotaExceeded as error:
            remaining = len(todo) - index + 1
            print(
                f"\nFree-tier quota reached — {error}.\n"
                f"{remaining} clip(s) still missing. Finished clips are kept: just re-run\n"
                f"  python3 scripts/generate_sprout_voice.py --voice {args.voice}\n"
                "tomorrow, or enable billing on the API key to finish in one go."
            )
            return 1
        pcm_to_mp3(pcm, target)
        print(
            f"    {len(pcm) / 1024:.0f} KB PCM → {target.stat().st_size / 1024:.0f} KB mp3 · "
            f"{duration_of(target):.1f}s · {time.time() - started:.1f}s"
        )
        if index < len(todo):
            time.sleep(args.delay)

    print(f"\nDone. {len(todo)} clip(s) written.")
    if skipped:
        print(f"{skipped} clip(s) left untouched (use --force to re-record).")
    remaining = [clip for clip in clips if not (OUT_DIR / clip["file"]).exists()]
    if remaining:
        print(f"{len(remaining)} clip(s) still missing overall.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

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

    logger.info("create_graphic called with model=%s (resolved from %s)", target_model, model)
    resp = requests.post(
        "https://openrouter.ai/api/v1/images",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": target_model,
            "prompt": prompt,
        },
        timeout=120,
    )
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

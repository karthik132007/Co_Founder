import json
import logging
import os
import base64
import uuid

import requests

from langchain.tools import tool
from agents.helpers.utils import base64_to_img

logger = logging.getLogger(__name__)

api = os.getenv("LLM_API_KEY")

# Module-level cache so the heavy base64 image never enters LLM context.
# Keyed by a token returned to the LLM; the caller retrieves the real
# data URL via get_generated_image().
_generated_images: dict[str, str] = {}


def get_generated_image(token: str) -> str | None:
    """Retrieve and remove a cached image data URL by token (one-shot read)."""
    return _generated_images.pop(token, None)


def has_generated_image(token: str) -> bool:
    """Check whether a cached image exists without removing it."""
    return token in _generated_images


@tool("create_graphic", description="Create a PNG graphic from a prompt and return it as a data URL.")
def create_graphic(company_id: int, prompt: str):
    """Generate a graphic for immediate display; persistence is handled by the chat API."""
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("A non-empty image prompt is required")
    if not api:
        raise RuntimeError("LLM_API_KEY is not configured for image generation")

    logger.info("create_graphic called")
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api}"},
        json={
            "model": "google/gemini-2.5-flash-image",
            "messages": [{"role": "user", "content": prompt}],
            "modalities": ["image", "text"]
        },
        timeout=120,
    )
    resp.raise_for_status()
    try:
        image_url = resp.json()["choices"][0]["message"]["images"][0]["image_url"]["url"]
        png_bytes = base64_to_img(image_url)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise RuntimeError("Image provider returned no valid base64 image") from exc
    if not png_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("Image provider returned an unsupported image format; expected PNG")

    logger.info("Graphic created successfully, PNG size: %d bytes", len(png_bytes))
    image_data_url = f"data:image/png;base64,{base64.b64encode(png_bytes).decode('ascii')}"

    # Stash the real image and return a tiny placeholder to the LLM so the
    # ~1MB base64 string never bloats the model's context window.
    token = uuid.uuid4().hex
    _generated_images[token] = image_data_url
    return json.dumps({"image_token": token, "mime_type": "image/png", "status": "Graphic generated successfully."})

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

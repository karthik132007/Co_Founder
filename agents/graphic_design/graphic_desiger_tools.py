import logging
import os
import requests, base64

from langchain.tools import tool

logger = logging.getLogger(__name__)

api=os.getenv('LLM_API_KEY')


@tool('create_graphic',description="create Images with prompt, returns raw png bites")
def create_graphic(prompt):
    logger.info("create_graphic called")
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api}"},
        json={
            "model": "google/gemini-2.5-flash-image-preview",
            "messages": [{"role": "user", "content": prompt}],
            "modalities": ["image", "text"]
        }
    )
    resp.raise_for_status()
    msg = resp.json()["choices"][0]["message"]
    b64 = msg["images"][0]["image_url"]["url"].split(",")[1]
    png_bytes = base64.b64decode(b64)
    logger.info("Graphic created successfully, PNG size: %d bytes", len(png_bytes))
    return png_bytes  # raw PNG bytes

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
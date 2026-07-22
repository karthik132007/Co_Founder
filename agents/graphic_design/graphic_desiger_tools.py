from langchain.tools import tool
import requests, base64
import os
api=os.getenv('LLM_API_KEY')


@tool('create_graphic',description="create Images with prompt, returns raw png bites")
def create_graphic(prompt):
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api}"},
        json={
            "model": "google/gemini-2.5-flash-image-preview",
            "messages": [{"role": "user", "content": prompt}],
            "modalities": ["image", "text"]
        }
    )
    msg = resp.json()["choices"][0]["message"]
    b64 = msg["images"][0]["image_url"]["url"].split(",")[1]
    return base64.b64decode(b64)  # raw PNG bytes

@tool('get_color_palette', description="Fetch the current active color palette (name + hex array) for the brand.")
def get_color_palette(company_id: int):
    """Fetch the current active color palette for the given company."""
    from backend.utils import get_supabase_client
    client = get_supabase_client()
    response = (
        client.table("color_palettes")
        .select("*")
        .eq("company_id", company_id)
        .eq("is_active", True)
        .execute()
    )
    return response.data[0] if response.data else {"palette": None, "message": "No active palette set"}


@tool
def update_color_palette(company_id: int, new_colors: list[str]):
    """Update (or create) the active color palette for a company with the given hex values."""
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

    return response.data[0] if response.data else {"error": "Failed to update color palette"}
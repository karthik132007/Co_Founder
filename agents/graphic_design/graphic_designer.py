import logging
import json
from collections.abc import Mapping

from langchain.agents import create_agent
from agents.helpers.choose_llm import get_best_llm,Task
from agents.graphic_design.graphic_desiger_tools import (
    get_color_palette,
    create_graphic,
    update_color_palette,
    has_generated_image,
)
from agents.graphic_design.graphic_designer_prompts import get_graphic_designer_system_prompt

logger = logging.getLogger(__name__)

tools=[get_color_palette,update_color_palette,create_graphic]

logger.info("Creating graphic designer agent")
graphic_designer_agent= create_agent(
    model=get_best_llm(tasks=[Task.ImageGen]),
    tools=tools,
    system_prompt=get_graphic_designer_system_prompt()
)
logger.info("Graphic designer agent created")


def spawn_graphic_designer(company_id: int, prompt: str, effort: str = "flash"):
    """Delegate a brand-graphics task to the Graphic Designer agent."""
    logger.info("spawn_graphic_designer called: company_id=%d, prompt='%.100s', effort=%s", company_id, prompt, effort)
    user_message = (
        f"The company_id for this task is {company_id}.\n"
        f"CRITICAL INSTRUCTIONS:\n"
        f"1. You MUST call the `create_graphic` tool to generate exactly ONE visual graphic. Do NOT simulate or describe without calling the tool.\n"
        f"2. Always generate a SINGLE static graphic (no multi-slide carousels unless the user explicitly requested multiple slides).\n"
        f"3. Use `google/gemini-2.5-flash-image` as the default cost-effective model. Only use `openai/gpt-image-2` if explicitly requested.\n\n"
        f"Task: {prompt}"
    )
    result = graphic_designer_agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_message,
                }
            ]
        }
    )
    # Retrieve the generated image from the cache (kept out of LLM context).
    image_token = _find_image_token(result)
    designer_text = _extract_content(result)
    if not designer_text:
        designer_text = "Here is the generated graphic based on your brand requirements."

    # Guarantee: if the agent hallucinated without calling create_graphic, trigger creation directly
    if not image_token:
        logger.warning("Graphic designer agent did not return an image token; triggering automatic graphic creation")
        try:
            palette_info = get_color_palette.invoke({"company_id": company_id})
            palette = palette_info.get("palette", []) if isinstance(palette_info, dict) else []
            colors_str = ", ".join(palette) if palette else "#FFFFFF, #1A1A2E"
            graphic_prompt = (
                f"{prompt}. High-quality marketing graphic. "
                f"Incorporate brand colors: {colors_str}. Clean, modern aesthetic, professional lighting."
            )
            raw_res = create_graphic.invoke({
                "company_id": company_id,
                "prompt": graphic_prompt,
                "model": "google/gemini-2.5-flash-image",
            })
            token_data = json.loads(raw_res)
            image_token = token_data.get("image_token")
            logger.info("Fallback graphic created successfully with token %s", image_token)
        except Exception as fb_err:
            logger.exception("Fallback graphic creation failed: %s", fb_err)

    if image_token:
        # Only peek — don't pop. talk_to_ceo will pop it when building the response.
        if has_generated_image(image_token):
            return json.dumps(
                {
                    "type": "image_generated",
                    "message": designer_text,
                    "image_token": image_token,
                }
            )
        logger.warning("Image token %s not found in cache for company_id=%d", image_token, company_id)

    logger.info("Graphic designer agent completed for company_id=%d", company_id)
    return designer_text


def _extract_content(response) -> str:
    """Extract the final assistant text content from agent messages."""
    messages = response.get("messages", []) if isinstance(response, Mapping) else []
    for msg in reversed(messages):
        role = getattr(msg, "role", None) or getattr(msg, "type", None)
        if role in ("assistant", "ai"):
            content = getattr(msg, "content", "")
            if isinstance(content, str) and content.strip():
                return content.strip()
    if messages:
        last = getattr(messages[-1], "content", "")
        if isinstance(last, str):
            return last.strip()
    return ""


def _find_image_token(response) -> str | None:
    """Find the create_graphic tool output and extract the image token."""
    messages = response.get("messages", []) if isinstance(response, Mapping) else []
    for message in reversed(messages):
        content = message.get("content") if isinstance(message, Mapping) else getattr(message, "content", None)
        candidate = None
        if isinstance(content, Mapping):
            candidate = content
        elif isinstance(content, str) and "image_token" in content:
            try:
                candidate = json.loads(content)
            except (json.JSONDecodeError, TypeError):
                continue
        if isinstance(candidate, Mapping) and candidate.get("image_token"):
            return str(candidate["image_token"])

    from agents.graphic_design.graphic_desiger_tools import _generated_images
    if _generated_images:
        return list(_generated_images.keys())[-1]

    return None


# Backwards-compatible alias for callers using the original misspelled name.
spwan_graphic_designer = spawn_graphic_designer

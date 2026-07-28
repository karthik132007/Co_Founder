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
            f"The company_id for this task is {company_id}. "
            f"Pass this company_id to every tool that accepts it, including the color-palette and create_graphic tools.\n\n"
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
    if image_token:
        # Only peek — don't pop. talk_to_ceo will pop it when building the response.
        if has_generated_image(image_token):
            return json.dumps(
                {
                    "type": "image_generated",
                    "message": "Graphic generated successfully.",
                    "image_token": image_token,
                }
            )
        logger.warning("Image token %s not found in cache for company_id=%d", image_token, company_id)

    logger.info("Graphic designer agent completed for company_id=%d", company_id)
    return _extract_content(result)


def _extract_content(response):
    return response["messages"][-1].content


def _find_image_token(response) -> str | None:
    """Find the create_graphic tool output and extract the image token."""
    for message in reversed(response.get("messages", [])):
        if getattr(message, "name", None) != "create_graphic":
            continue
        content = getattr(message, "content", None)
        if isinstance(content, Mapping):
            candidate = content
        elif isinstance(content, str):
            try:
                candidate = json.loads(content)
            except json.JSONDecodeError:
                continue
        else:
            continue
        image_token = candidate.get("image_token") if isinstance(candidate, Mapping) else None
        if isinstance(image_token, str) and image_token:
            return image_token
    return None


# Backwards-compatible alias for callers using the original misspelled name.
spwan_graphic_designer = spawn_graphic_designer

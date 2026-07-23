import logging

import dotenv
from langchain_core.messages import HumanMessage

from agents.helpers.choose_llm import get_best_llm, Task
from agents.helpers.datetime_context import get_datetime_context
from agents.helpers.utils import img_to_base64

logger = logging.getLogger(__name__)

dotenv.load_dotenv()

logger.info("Creating image description model")
model = get_best_llm([Task.OCR])
logger.info("Image description model created")

prompt = f"""
{get_datetime_context()}

You are an AI assistant responsible for indexing business files.

Analyze the uploaded image thoroughly.

Include:
- One sentence summary
- Detailed description
- All visible text (OCR)
- Logos or brands
- Products shown
- People (if any)
- Objects
- Scene/environment
- Colors
- Charts, tables or diagrams
- Business relevance
- Search keywords/tags

Write everything as natural paragraphs.
Do not use markdown.
Return only the description.
"""

def get_image_description(image: bytes,mime_type: str):
    logger.info("get_image_description called: mime_type='%s'", mime_type)

    image_b64 = img_to_base64(image)  # content = uploaded image bytes

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": prompt

            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{image_b64}"
                }
            }
        ]
    )
    try:
        response = model.invoke([message])
        if isinstance(response.content, str):
            logger.info("Image description generated successfully")
            return response.content
        logger.info("Image description generated successfully (non-string)")
        return str(response.content)

    except Exception as e:
        logger.error("Failed to generate image description: %s", e, exc_info=True)
        raise RuntimeError(f"Failed to generate image description: {e}") from e

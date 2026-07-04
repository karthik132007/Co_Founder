from langchain.chat_models import init_chat_model
from helpers.choose_llm import get_best_llm, Task
import dotenv
from langchain_core.messages import HumanMessage
from helpers.utils import img_to_base64
dotenv.load_dotenv()

model = init_chat_model(
    model=get_best_llm([Task.OCR]),
)

prompt = """
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
            return response.content
        return str(response.content)

    except Exception as e:

        raise RuntimeError(f"Failed to generate image description: {e}") from e
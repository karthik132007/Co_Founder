from langchain.chat_models import init_chat_model
from helpers.choose_llm import get_best_llm, Task
import dotenv

dotenv.load_dotenv()
model_name = get_best_llm([Task.CLASSIFICATION])

if model_name == "google/gemma-4-26b-a4b-it":
    model_name = "google/gemma-4-26B-A4B-it" #according to langchain

model = init_chat_model(
    model=model_name,
)

def get_file_description(file_content: bytes):
    prompt = f"""
You are an expert document analysis AI.

Your task is to analyze the provided document and generate a rich, retrieval-optimized description.

The description should help another AI quickly understand what information exists inside the file without reading the entire document.

Include:
- Main purpose of the document
- Important topics covered
- Key entities (people, companies, products, technologies, places)
- Important keywords
- Important concepts
- Types of information contained (requirements, meeting notes, invoices, contracts, source code, research, marketing, etc.)
- Time period if mentioned
- Overall context
- Any useful metadata inferred from the content

Rules:
- Write a concise but information-dense paragraph.
- Preserve important names and terminology exactly.
- Do NOT hallucinate information.
- Do NOT mention that this is a summary.
- Do NOT use bullet points.
- Return only the description text.

Document:
--------------------
{file_content}
--------------------
"""

    return model.invoke(prompt).content
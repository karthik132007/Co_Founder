from enum import Enum
from typing import Iterable

from agents.helpers.CreateLLM import create_llm


class Task(str, Enum):
    CREATIVE = "creative"
    RESEARCH = "research"
    WRITING = "writing"
    DATA_ANALYSIS = "data_analysis"
    PLANNING = "planning"
    CLASSIFICATION = "classification"
    OCR = "ocr"

class Model(str, Enum):
    QWEN = "qwen/qwen3-coder-next"      # fallback
    DEEPSEEK = "deepseek/deepseek-v4-flash"
    MIMO = "xiaomi/mimo-v2.5"
    GEMMA = "google/gemma-4-26b-a4b-it"
    GLM = "z-ai/glm-4.5-air"
    GPT_OSS = "openai/gpt-oss-120b"


TASK_TO_MODEL = {
    Task.CREATIVE: Model.GPT_OSS,
    Task.RESEARCH: Model.GLM,
    Task.WRITING: Model.DEEPSEEK,
    Task.DATA_ANALYSIS: Model.DEEPSEEK,
    Task.PLANNING: Model.GLM,
    Task.CLASSIFICATION: Model.MIMO,
    Task.OCR: Model.GEMMA,
}


DEFAULT_MODEL = Model.DEEPSEEK


def get_best_llm(tasks: Iterable[Task]):
    """
    Return the most suitable model for a list of tasks.
    Higher-priority tasks win.
    """

    priority = (
        Task.CREATIVE,
        Task.PLANNING,
        Task.RESEARCH,
        Task.DATA_ANALYSIS,
        Task.WRITING,
        Task.CLASSIFICATION,
        Task.OCR,
    )

    task_set = set(tasks)

    for task in priority:
        if task in task_set:
            return create_llm(TASK_TO_MODEL[task].value)

    return create_llm(DEFAULT_MODEL.value)
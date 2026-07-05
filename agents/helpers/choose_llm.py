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
    QWEN = "qwen/qwen3-coder-next"
    DEEPSEEK = "deepseek/deepseek-v4-flash"
    MIMO = "xiaomi/mimo-v2.5"
    GEMMA = "google/gemma-4-26b-a4b-it"
    GLM = "z-ai/glm-4.5-air"
    GPT_OSS = "openai/gpt-oss-120b"


DEFAULT_MODEL = Model.DEEPSEEK


def get_best_llm(tasks: Iterable[Task]):
    """
    Select the best LLM based on the combination of tasks.

    Strategy:
    - OCR -> Gemma
    - Classification -> MIMO
    - Research-heavy workflows -> DeepSeek (1M context)
    - Data analysis / coding -> DeepSeek
    - Writing -> DeepSeek
    - Pure planning -> GLM
    - Pure creative -> GPT-OSS
    """

    task_set = set(tasks)

    # Vision / OCR
    if Task.OCR in task_set:
        return create_llm(Model.GEMMA.value)

    # Classification
    if Task.CLASSIFICATION in task_set:
        return create_llm(Model.MIMO.value)

    # Research dominates everything else because it usually
    # involves tool outputs and long contexts.
    if Task.RESEARCH in task_set:
        return create_llm(Model.DEEPSEEK.value)

    # Coding / data work
    if Task.DATA_ANALYSIS in task_set:
        return create_llm(Model.DEEPSEEK.value)

    # Writing benefits from DeepSeek as well
    if Task.WRITING in task_set:
        return create_llm(Model.DEEPSEEK.value)

    # Planning without research
    if Task.PLANNING in task_set:
        return create_llm(Model.GLM.value)

    # Pure creative generation
    if Task.CREATIVE in task_set:
        return create_llm(Model.GPT_OSS.value)

    return create_llm(DEFAULT_MODEL.value)
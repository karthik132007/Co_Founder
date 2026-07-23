import logging
from enum import Enum
from typing import Iterable

from agents.helpers.CreateLLM import create_llm

logger = logging.getLogger(__name__)


class Task(str, Enum):
    CREATIVE = "creative"
    RESEARCH = "research"
    WRITING = "writing"
    DATA_ANALYSIS = "data_analysis"
    PLANNING = "planning"
    CLASSIFICATION = "classification"
    OCR = "ocr"
    ImageGen = "image_genration"


class Model(str, Enum):
    QWEN = "qwen/qwen3-coder-next"
    DEEPSEEK = "deepseek/deepseek-v4-flash"
    MIMO = "xiaomi/mimo-v2.5"
    GEMMA = "google/gemma-4-26b-a4b-it"
    GLM = "z-ai/glm-4.5-air"
    GPT_OSS = "openai/gpt-oss-120b"
    SEEDREAM = "bytedance-seed/seedream-4.5"


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
    
    if Task.ImageGen in task_set:
            logger.info("Selected model %s for ImageGen task", Model.SEEDREAM.value)
            return create_llm(Model.SEEDREAM.value)
    # Vision / OCR
    if Task.OCR in task_set:
        logger.info("Selected model %s for OCR task", Model.GEMMA.value)
        return create_llm(Model.GEMMA.value)

    # Classification
    if Task.CLASSIFICATION in task_set:
        logger.info("Selected model %s for Classification task", Model.MIMO.value)
        return create_llm(Model.MIMO.value)

    # Research dominates everything else because it usually
    # involves tool outputs and long contexts.
    if Task.RESEARCH in task_set:
        logger.info("Selected model %s for Research task", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Coding / data work
    if Task.DATA_ANALYSIS in task_set:
        logger.info("Selected model %s for Data Analysis task", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Writing benefits from DeepSeek as well
    if Task.WRITING in task_set:
        logger.info("Selected model %s for Writing task", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Planning without research
    if Task.PLANNING in task_set:
        logger.info("Selected model %s for Planning task", Model.GLM.value)
        return create_llm(Model.GLM.value)

    # Pure creative generation
    if Task.CREATIVE in task_set:
        logger.info("Selected model %s for Creative task", Model.GPT_OSS.value)
        return create_llm(Model.GPT_OSS.value)

    logger.info("No specific task matched, using default model %s", DEFAULT_MODEL.value)
    return create_llm(DEFAULT_MODEL.value)
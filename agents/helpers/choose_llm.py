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
    MIMO = "openai/gpt-oss-20b"
    MORPH = "morph/morph-v3-fast"
    GEMMA = "google/gemma-4-26b-a4b-it"
    GLM = "z-ai/glm-4.5-air"
    GPT_OSS = "openai/gpt-oss-120b"
    SEEDREAM = "bytedance-seed/seedream-4.5"


DEFAULT_MODEL = Model.DEEPSEEK


def get_best_llm(tasks: Iterable[Task], effort: str = "flash"):
    """
    Select the best LLM based on tasks + effort level.

    Model capabilities (OpenRouter, 2026-07):
      - deepseek/deepseek-v4-flash   Very fast, 1M ctx, excellent price/perf
      - z-ai/glm-4.5-air             Strong tool-use, agents & coding
      - openai/gpt-oss-120b          High-end reasoning (best quality)
      - openai/gpt-oss-20b           Small reasoning model (classification)
      - google/gemma-4-26b-a4b-it    General reasoning, multimodal, MoE
      - morph/morph-v3-fast          File-editing engine — NOT a general LLM
      - qwen/qwen3-coder-next        Strong coding-focused MoE

    effort → model mapping:
      flash: DeepSeek (very fast) for everything, MIMO for classification
      mid:   DeepSeek for research/data, GLM for tool-use agents, DeepSeek for writing
      max:   DeepSeek for research/data, GLM for tool-use agents, GPT_OSS for writing/creative
    """

    if effort not in ("flash", "mid", "max"):
        effort = "flash"

    task_set = set(tasks)

    # ═══════════════════════════════════════════════════════════════
    #  FLASH — DeepSeek for everything (very fast, excellent perf)
    # ═══════════════════════════════════════════════════════════════
    if effort == "flash":
        if Task.OCR in task_set:
            logger.info("Selected model %s for OCR task (flash)", Model.GEMMA.value)
            return create_llm(Model.GEMMA.value)
        if Task.CLASSIFICATION in task_set:
            logger.info("Selected model %s for Classification task (flash)", Model.MIMO.value)
            return create_llm(Model.MIMO.value)
        # DeepSeek is very fast with 1M context — ideal flash model
        logger.info("Selected model %s (flash mode)", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # ═══════════════════════════════════════════════════════════════
    #  MID — balanced: DeepSeek for heavy work, GLM for tool agents
    # ═══════════════════════════════════════════════════════════════
    if effort == "mid":
        if Task.OCR in task_set:
            logger.info("Selected model %s for OCR task (mid)", Model.GEMMA.value)
            return create_llm(Model.GEMMA.value)
        if Task.CLASSIFICATION in task_set:
            logger.info("Selected model %s for Classification task (mid)", Model.MIMO.value)
            return create_llm(Model.MIMO.value)
        # Tool-heavy agents (Planning + Research) → GLM (strong tool-use)
        if Task.PLANNING in task_set and (Task.RESEARCH in task_set or Task.DATA_ANALYSIS in task_set):
            logger.info("Selected model %s for tool-use agent (mid)", Model.GLM.value)
            return create_llm(Model.GLM.value)
        # Research / Data → DeepSeek (1M context, fast)
        if Task.RESEARCH in task_set or Task.DATA_ANALYSIS in task_set:
            logger.info("Selected model %s for Research/Data task (mid)", Model.DEEPSEEK.value)
            return create_llm(Model.DEEPSEEK.value)
        # Writing, Creative, Planning → DeepSeek (fast + good quality)
        logger.info("Selected model %s for Writing/Creative/Planning (mid)", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # ═══════════════════════════════════════════════════════════════
    #  MAX — best quality: GPT_OSS for writing, GLM for tool agents
    # ═══════════════════════════════════════════════════════════════
    if Task.OCR in task_set:
        logger.info("Selected model %s for OCR task (max)", Model.GEMMA.value)
        return create_llm(Model.GEMMA.value)

    if Task.CLASSIFICATION in task_set:
        logger.info("Selected model %s for Classification task (max)", Model.MIMO.value)
        return create_llm(Model.MIMO.value)

    # ImageGen orchestration → DeepSeek (needs reliable tool calling)
    if Task.ImageGen in task_set:
        logger.info("Selected model %s for ImageGen orchestration (max)", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Tool-heavy agents → GLM (best tool-use model)
    if Task.PLANNING in task_set and (Task.RESEARCH in task_set or Task.DATA_ANALYSIS in task_set):
        logger.info("Selected model %s for tool-use agent (max)", Model.GLM.value)
        return create_llm(Model.GLM.value)

    # Research → DeepSeek (1M context for long tool outputs)
    if Task.RESEARCH in task_set:
        logger.info("Selected model %s for Research task (max)", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Data Analysis → DeepSeek
    if Task.DATA_ANALYSIS in task_set:
        logger.info("Selected model %s for Data Analysis task (max)", Model.DEEPSEEK.value)
        return create_llm(Model.DEEPSEEK.value)

    # Writing / Creative → GPT_OSS (high-end reasoning, best quality)
    if Task.WRITING in task_set or Task.CREATIVE in task_set:
        logger.info("Selected model %s for Writing/Creative task (max)", Model.GPT_OSS.value)
        return create_llm(Model.GPT_OSS.value)

    # Pure Planning → GLM
    if Task.PLANNING in task_set:
        logger.info("Selected model %s for Planning task (max)", Model.GLM.value)
        return create_llm(Model.GLM.value)

    logger.info("No specific task matched, using default model %s", DEFAULT_MODEL.value)
    return create_llm(DEFAULT_MODEL.value)

from enum import Enum
from typing import Iterable


class Task(str, Enum):
    CODING = "coding"
    RESEARCH = "research"
    WRITING = "writing"
    DATA_ANALYSIS = "data_analysis"
    PLANNING = "planning"
    CLASSIFICATION = "classification"


class Model(str, Enum):
    QWEN = "qwen/qwen3-coder-next" # can use as default fallback model for any task
    DEEPSEEK = "deepseek/deepseek-v4-flash"
    MIMO = "xiaomi/mimo-v2.5"
    GLM = "z-ai/glm-4.5-air"
    GPT_OSS = "openai/gpt-oss-120b"


TASK_TO_MODEL = {
    Task.CODING: Model.GPT_OSS,
    Task.RESEARCH: Model.GLM,
    Task.WRITING: Model.DEEPSEEK,
    Task.DATA_ANALYSIS: Model.DEEPSEEK,
    Task.PLANNING: Model.GLM,
    Task.CLASSIFICATION: Model.MIMO,
}


DEFAULT_MODEL = Model.DEEPSEEK


def get_best_llm(tasks: Iterable[Task]) -> str:
    """
    Return the most suitable model for a list of tasks.
    Higher-priority tasks win.
    """

    priority = (
        Task.CODING,
        Task.PLANNING,
        Task.RESEARCH,
        Task.DATA_ANALYSIS,
        Task.WRITING,
        Task.CLASSIFICATION,
    )

    task_set = set(tasks)

    for task in priority:
        if task in task_set:
            return TASK_TO_MODEL[task]

    return DEFAULT_MODEL.value
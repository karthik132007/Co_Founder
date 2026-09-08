import logging

logger = logging.getLogger(__name__)

TEXT_MODELS = {
    "deepseek/deepseek-v4-flash": {"input": 0.0455, "output": 0.390875},
    "z-ai/glm-4.5-air": {"input": 0.0455, "output": 0.390875},
    "openai/gpt-oss-120b": {"input": 0.15, "output": 0.60},
    "google/gemma-4-26b-a4b-it": {"input": 0.0455, "output": 0.390875},
    "openai/gpt-oss-20b": {"input": 0.05, "output": 0.20},
    "qwen/qwen3-coder-next": {"input": 0.08, "output": 0.30},
    "morph/morph-v3-fast": {"input": 0.05, "output": 0.25},
    "bytedance-seed/seedream-4.5": {"input": 0.05, "output": 0.25},
}

DEFAULT_TEXT_PRICE = {"input": 0.0455, "output": 0.390875}

IMAGE_MODELS = {
    "google/gemini-2.5-flash-image": {"input": 0.3, "output": 2.5, "per_image": 0.03},
    "openai/gpt-image-2": {"input": 7.65, "output": 30.0, "per_image": 0.08},
}

DEFAULT_IMAGE_PRICE = {"input": 0.3, "output": 2.5, "per_image": 0.03}


def get_model_price(model_name: str, is_image_model: bool = False):
    if not model_name:
        return {"error": "Model not found"}

    clean_name = str(model_name).split(":")[0].strip().lower()

    if is_image_model:
        for key, price in IMAGE_MODELS.items():
            if clean_name == key.lower():
                return dict(price)
        logger.warning("Unlisted image model '%s', using default image pricing", model_name)
        return dict(DEFAULT_IMAGE_PRICE)

    for key, price in TEXT_MODELS.items():
        if clean_name == key.lower():
            return dict(price)

    logger.info("Model '%s' not explicitly in catalogue, using default text model pricing", model_name)
    return dict(DEFAULT_TEXT_PRICE)
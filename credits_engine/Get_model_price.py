def get_model_price(model_name, is_image_model=False):

    text_models = [
        "deepseek/deepseek-v4-flash",
        "z-ai/glm-4.5-air",
        "openai/gpt-oss-120b",
        "google/gemma-4-26b-a4b-it"
    ]

    if model_name in text_models:
        return {
            "input": 0.0455,
            "output": 0.390875
        }

    if is_image_model:

        if model_name == "google/gemini-2.5-flash-image":
            return {
                "input": 0.3,
                "output": 2.5
            }

        if model_name == "openai/gpt-image-2":
            return {
                "input": 7.65,
                "output": 30
            }

        if model_name == "x-ai/grok-imagine-image-2.0":
            return {
                "image": 0.04
            }

    return {
        "error": "Model not found"
    }
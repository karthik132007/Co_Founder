import logging
from decimal import Decimal, ROUND_HALF_UP

from credits_engine.Get_model_price import get_model_price

logger = logging.getLogger(__name__)

MARKUP = 2
USD_INR = 100

IMAGE_MODELS = {
    "google/gemini-2.5-flash-image",
    "openai/gpt-image-2",
    "x-ai/grok-imagine-image-2.0",
}


def get_usage(model_name, input_tokens, output_tokens,image_count=0):

    if not  model_name:
        return {
            "error" : "model name is required"
        }
    is_image_model = image_count > 0
    market_model_price = get_model_price(model_name, is_image_model)


    if "error" in market_model_price:
        return {
            "error" : "no model found"
        }

    input_cost = (
        input_tokens / 1_000_000
        ) * market_model_price.get("input", 0)

    output_cost = (
        output_tokens / 1_000_000
        ) * market_model_price.get("output", 0)

    #image
    image_cost_for_grok = 0
    if image_count > 0:

        # Grok charges per image
        if model_name == "x-ai/grok-imagine-image-2.0":
            image_cost_for_grok = 0.04 * image_count

    total_cost = (
        input_cost
        + output_cost
        + image_cost_for_grok
    )

    selling_price_usd = total_cost * MARKUP

    selling_price_inr = (
        selling_price_usd * USD_INR
    )

    # 1 credit = ₹1 selling value
    total_credits = selling_price_inr

    return {
        "model": model_name,

        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "image_count": image_count,

        "input_cost_usd": input_cost,
        "output_cost_usd": output_cost,
        "image_cost_usd_for_grok": image_cost_for_grok,
        "total_cost_usd": total_cost,
        "markup": MARKUP,
        "selling_price_usd": selling_price_usd,
        "selling_price_inr": selling_price_inr,
        "credits": total_credits
    }


def get_total_usage(usage: list[dict], no_of_images: int = 0) -> dict:
    """Price a single request that may have used several models.

    ``usage`` is the per-model breakdown emitted by the CEO agent, e.g.::

        [
            {"model": "deepseek/deepseek-v4-flash",
             "input_tokens": 1200, "output_tokens": 340},
            {"model": "x-ai/grok-imagine-image-2.0",
             "input_tokens": 0, "output_tokens": 0,
             "image_count": 2},
        ]

    Returns ``{"total_credits": float, "per_model": [...]}`` where credits are
    in INR (1 credit == 1 rupee of selling value).  Models that cannot be
    priced are skipped with a warning instead of failing the whole request.
    """
    total = Decimal("0")
    per_model = []
    for item in usage or []:
        model = item.get("model")
        input_tokens = int(item.get("input_tokens") or 0)
        output_tokens = int(item.get("output_tokens") or 0)
        image_count = int(item.get("image_count") or 0)
        result = get_usage(model, input_tokens, output_tokens, image_count=image_count)
        if "error" in result:
            logger.warning("Cannot price model=%s: %s", model, result["error"])
            continue
        credits = Decimal(str(result["credits"]))
        total += credits
        per_model.append(
            {
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "image_count": image_count,
                "credits": float(credits),
            }
        )

    if no_of_images and not any(pm.get("image_count") for pm in per_model):
        logger.warning(
            "no_of_images=%s but no priced image-model entry found — "
            "image charge skipped",
            no_of_images,
        )

    return {
        "total_credits": float(total.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)),
        "per_model": per_model,
    }

from credits_engine.Get_model_price import get_model_price

MARKUP = 2
USD_INR = 100
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

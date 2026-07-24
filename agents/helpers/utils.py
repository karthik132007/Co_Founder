import logging
import os
import base64
import binascii
import re

logger = logging.getLogger(__name__)
MAX_IMAGE_PAYLOAD_BYTES = 10 * 1024 * 1024


def _get_tavily_client():
    try:
        from tavily import TavilyClient
    except ImportError as exc:
        logger.error("tavily package is not installed")
        raise RuntimeError("tavily is not installed") from exc

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.error("TAVILY_API_KEY is not set")
        raise RuntimeError("TAVILY_API_KEY is not set")

    client = TavilyClient(api_key=api_key)
    return client

def img_to_base64(img_file):
    if isinstance(img_file, bytes):
        result = base64.b64encode(img_file).decode("utf-8")
        return result
    
    with open(img_file, "rb") as image_file:
        result = base64.b64encode(image_file.read()).decode("utf-8")
    return result

def base64_to_img(value: str) -> bytes:
    """Decode a raw base64 image payload or a base64 data URL into bytes."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Image payload must be a non-empty base64 string")

    payload = value.strip()
    if payload.startswith("data:"):
        match = re.fullmatch(r"data:[^;,]+;base64,([A-Za-z0-9+/=\s]+)", payload, re.DOTALL)
        if not match:
            raise ValueError("Image data URL must contain a valid base64 payload")
        payload = match.group(1)

    payload = re.sub(r"\s+", "", payload)
    # Base64 expands binary data by roughly one third; reject oversized previews
    # before allocating a large decoded buffer.
    if len(payload) > (MAX_IMAGE_PAYLOAD_BYTES * 4 // 3) + 4:
        raise ValueError("Image payload exceeds the 10 MiB limit")
    try:
        image_bytes = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Image payload is not valid base64") from exc
    if len(image_bytes) > MAX_IMAGE_PAYLOAD_BYTES:
        raise ValueError("Image payload exceeds the 10 MiB limit")
    return image_bytes

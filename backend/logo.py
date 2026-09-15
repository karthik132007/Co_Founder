"""Company logo conventions and image helpers.

Every company has at most one canonical logo, stored in the company files
bucket under a predictable name: `logo.png` (`{company_id}/logo.png`). The
onboarding flow offers it as an optional step, and founders who skip it (or
who created their company before the feature existed) are prompted from the
app until a `logo.png` shows up in their Drive.
"""

import logging
import os
from io import BytesIO

logger = logging.getLogger(__name__)

# Canonical logo identity — keep in sync with the frontend prompt.
LOGO_FILE_NAME = "logo.png"
LOGO_MIME_TYPE = "image/png"
LOGO_BUCKET = "company_files"

# Raster formats Pillow can decode into a real PNG. SVG is deliberately NOT
# converted — the canonical logo.png must always be a raster image.
CONVERTIBLE_IMAGE_EXTENSIONS = {
    "png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "avif",
}

# Any image extension a founder may hand-upload as `logo.<ext>` in the Drive.
IMAGE_FILE_EXTENSIONS = CONVERTIBLE_IMAGE_EXTENSIONS | {"svg", "ico"}

DEFAULT_MAX_LOGO_BYTES = 5 * 1024 * 1024


class InvalidLogoImage(ValueError):
    """Raised when the uploaded bytes cannot be decoded as an image."""


class LogoTooLarge(ValueError):
    """Raised when the uploaded logo exceeds the configured size limit."""


def max_logo_bytes() -> int:
    """Maximum accepted logo size in bytes (env override: MAX_LOGO_BYTES)."""
    raw = os.getenv("MAX_LOGO_BYTES", str(DEFAULT_MAX_LOGO_BYTES))
    try:
        return int(raw)
    except ValueError:
        logger.warning(
            "Invalid MAX_LOGO_BYTES=%s — falling back to %d bytes",
            raw,
            DEFAULT_MAX_LOGO_BYTES,
        )
        return DEFAULT_MAX_LOGO_BYTES


def normalize_logo_to_png(content: bytes) -> bytes:
    """Return PNG bytes for an uploaded logo.

    Non-PNG uploads (jpg/webp/…) are transcoded so the stored `logo.png` really
    is a PNG. Raises `InvalidLogoImage` when the bytes are not a decodable
    image. If Pillow is missing, the original bytes are stored unchanged and a
    warning is logged — a cosmetic asset must never block onboarding.
    """
    try:
        from PIL import Image
    except ImportError:  # pragma: no cover - Pillow is in requirements.txt
        logger.warning("Pillow is not installed — storing the logo without PNG conversion")
        return content

    try:
        with Image.open(BytesIO(content)) as image:
            image.load()
            converted = image.convert("RGBA") if image.mode in ("RGBA", "LA", "P") else image.convert("RGB")
            buffer = BytesIO()
            converted.save(buffer, format="PNG", optimize=True)
            return buffer.getvalue()
    except Exception as exc:
        logger.warning("Uploaded logo could not be decoded as an image: %s", exc)
        raise InvalidLogoImage("That file is not a valid image.") from exc

"""Company logo endpoints — `/user/logo`.

Onboarding offers the logo as an optional step; founders who skip it (or whose
company predates the feature) are prompted from the app until a `logo.png`
exists in their company files. Uploads are always normalized to PNG and stored
under the canonical path `{company_id}/logo.png`, so every other subsystem can
find the brand logo by name alone.
"""

import logging
from pathlib import Path as FilePath

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile

from backend.api.rate_limit import SlidingWindowRateLimiter
from backend.db.get_from_sql import find_canonical_logo, get_company_id, get_company_logo, get_user_files
from backend.db.insert_to_sql import add_meta_to_file, update_file_meta
from backend.db.put_to_drive import upload_company_logo
from backend.logo import (
    IMAGE_FILE_EXTENSIONS,
    LOGO_BUCKET,
    LOGO_FILE_NAME,
    LOGO_MIME_TYPE,
    InvalidLogoImage,
    max_logo_bytes,
    normalize_logo_to_png,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["Logo"])

LOGO_DESCRIPTION = "Company logo uploaded by the founder."

# Decoding/converting images is cheap but hits storage on every call.
_logo_limiter = SlidingWindowRateLimiter(max_attempts=20, window_seconds=60)


def _human_size(num_bytes: int) -> str:
    """Readable byte size for error messages (e.g. 5MB, 512KB, 800 bytes)."""
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):g}MB"
    if num_bytes >= 1024:
        return f"{num_bytes // 1024}KB"
    return f"{num_bytes} bytes"


def _require_company_id(user_id: int) -> int:
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")
    return company_id


@router.get("/logo")
def get_logo(user_id: int = Query(..., description="User ID")):
    """Report whether the company already has a logo (`logo.png` in the Drive)."""
    company_id = _require_company_id(user_id)
    logo = get_company_logo(company_id)
    if not logo:
        logger.info("No company logo found — company_id=%s", company_id)
        return {
            "has_logo": False,
            "file_id": None,
            "original_file_name": None,
            "updated_at": None,
        }

    logger.info("Company logo found — company_id=%s, file_id=%s", company_id, logo.get("id"))
    return {
        "has_logo": True,
        "file_id": logo.get("id"),
        "original_file_name": logo.get("original_file_name") or logo.get("file_name"),
        "updated_at": logo.get("updated_at") or logo.get("created_at"),
    }


@router.post("/logo")
def upload_logo(user_id: int, file: UploadFile, request: Request):
    """Save an uploaded image as the company's `logo.png` (replacing any previous one)."""
    _logo_limiter.check(request)
    logger.info("upload_logo called — user_id=%s, filename=%s, content_type=%s", user_id, file.filename, file.content_type)
    company_id = _require_company_id(user_id)

    file_bytes = file.file.read()
    if not file_bytes:
        logger.warning("Uploaded logo is empty — user_id=%s", user_id)
        raise HTTPException(status_code=400, detail="Uploaded logo is empty.")

    limit = max_logo_bytes()
    if len(file_bytes) > limit:
        logger.warning("Uploaded logo too large (%d bytes) — user_id=%s", len(file_bytes), user_id)
        raise HTTPException(status_code=413, detail=f"Logo must be {_human_size(limit)} or smaller.")

    original_name = file.filename or LOGO_FILE_NAME
    extension = FilePath(original_name).suffix.lstrip(".").lower()
    content_type = (file.content_type or "").lower()
    if not (content_type.startswith("image/") or extension in IMAGE_FILE_EXTENSIONS):
        logger.warning("Rejected non-image logo upload — user_id=%s, content_type=%s", user_id, content_type)
        raise HTTPException(status_code=400, detail="Logo must be an image file (PNG, JPG, WEBP or GIF).")

    try:
        png_bytes = normalize_logo_to_png(file_bytes)
    except InvalidLogoImage as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        storage_path = upload_company_logo(company_id, png_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"Could not store the logo: {exc}") from exc

    # Keep a single canonical row: reuse the existing logo.png metadata, otherwise create it.
    existing = find_canonical_logo(get_user_files(company_id))
    if existing:
        updated = update_file_meta(
            existing["id"],
            storage_path=storage_path,
            file_name=LOGO_FILE_NAME,
            original_file_name=LOGO_FILE_NAME,
            mime_type=LOGO_MIME_TYPE,
            file_extension="png",
            file_size=len(png_bytes),
            description=LOGO_DESCRIPTION,
            status="ready",
        )
        file_id = (updated or existing).get("id")
    else:
        try:
            record = add_meta_to_file(
                company_id=company_id,
                file_name=LOGO_FILE_NAME,
                original_file_name=LOGO_FILE_NAME,
                storage_path=storage_path,
                mime_type=LOGO_MIME_TYPE,
                bucket_name=LOGO_BUCKET,
                description=LOGO_DESCRIPTION,
                file_extension="png",
                file_size=len(png_bytes),
            )
        except RuntimeError as exc:
            logger.exception("Failed to store logo metadata — company_id=%s", company_id)
            raise HTTPException(status_code=500, detail="Logo uploaded but could not be registered in your Drive.") from exc
        file_id = record.id

    logger.info("Company logo saved — company_id=%s, file_id=%s, size=%d", company_id, file_id, len(png_bytes))
    return {
        "status": "ok",
        "has_logo": True,
        "file_id": file_id,
        "message": "Logo saved as logo.png in your Drive",
    }

import logging
from typing import Optional

from fastapi import APIRouter, Path
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from backend.db.insert_to_sql import create_company
from backend.models import CompanyCreate

from backend.db.get_from_sql import (
    get_company_id,
    get_company_by_user,
    get_user_files,
    get_dashboard_stats,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

@router.post("/onboarding")
def onboarding(company: CompanyCreate):
    logger.info("onboarding called — company_name=%s, user_id=%s", company.company_name, company.user_id)
    tone = company.tone or "professional"
    allowed_tones = {"friendly", "professional", "witty"}

    if tone not in allowed_tones:
        logger.warning("Invalid tone '%s' for company=%s", tone, company.company_name)
        raise HTTPException(status_code=422, detail="Tone must be friendly, professional, or witty")

    if len(company.small_description.split()) > 500:
        logger.warning("Small description too long (%d words) for company=%s", len(company.small_description.split()), company.company_name)
        raise HTTPException(status_code=422, detail="Small description must be 500 words or less")

    created = create_company(
        company_name=company.company_name,
        small_description=company.small_description,
        industry=company.industry,
        tone=tone,
        user_id=company.user_id,
    )
    if created:
        logger.info("Company created successfully — id=%s, name=%s", created.id, created.company_name)
        return {"id": created.id, "company_name": created.company_name, "message": "Company created"}
    logger.error("Failed to create company for user_id=%s", company.user_id)
    raise HTTPException(status_code=400, detail="Failed to create company")


@router.get("/dashboard")
def user_dashboard(user_id: int = Query(..., description="User ID")):
    """Return dashboard overview data for a user's company."""
    logger.info("user_dashboard called — user_id=%s", user_id)
    company = get_company_by_user(user_id)
    if not company:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")

    company_id = company["id"]
    stats = get_dashboard_stats(company_id)
    files = get_user_files(company_id)
    logger.info("Dashboard data retrieved — company_id=%s, files=%d, total_size=%d", company_id, stats.get("total_files", 0), stats.get("total_size_bytes", 0))

    return {
        "company": {
            "id": company["id"],
            "company_name": company["company_name"],
            "industry": company["industry"],
            "tone": company.get("tone", "professional"),
            "small_description": company["small_description"],
        },
        "stats": stats,
        "recent_files": files[:5],  # latest 5 files
    }


class ProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    small_description: Optional[str] = None
    industry: Optional[str] = None
    tone: Optional[str] = None


@router.get("/profile")
def get_profile(user_id: int = Query(..., description="User ID")):
    """Return user + company profile data for settings/profile pages."""
    logger.info("get_profile called — user_id=%s", user_id)
    company = get_company_by_user(user_id)
    if not company:
        raise HTTPException(status_code=404, detail="No company found. Complete onboarding first.")

    return {
        "user": {
            "id": user_id,
            "email": "",  # Filled by frontend session
        },
        "company": {
            "id": company["id"],
            "company_name": company["company_name"],
            "small_description": company["small_description"],
            "industry": company["industry"],
            "tone": company.get("tone", "professional"),
        },
    }


@router.put("/profile")
def update_profile(
    body: ProfileUpdate,
    user_id: int = Query(..., description="User ID"),
):
    """Update company profile fields. Only provided fields are changed."""
    from backend.db.insert_to_sql import update_company

    logger.info("update_profile called — user_id=%s, fields=%s", user_id, body.model_dump(exclude_none=True))

    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="No company found.")

    payload = body.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        updated = update_company(company_id=company_id, **payload)
        return {"status": "ok", "company": updated}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
def list_user_files(user_id: int = Query(..., description="User ID")):
    """Return all files for a user's company."""
    logger.info("list_user_files called — user_id=%s", user_id)
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")

    files = get_user_files(company_id)
    logger.info("Returning %d files for company_id=%s", len(files), company_id)
    return {"files": files, "total": len(files)}


@router.get("/files/{file_id}/download")
def download_file(
    file_id: int = Path(..., description="File ID"),
    user_id: int = Query(..., description="User ID"),
    view: bool = Query(False, description="If true, serve inline; otherwise force download"),
):
    """Redirect to a signed Supabase Storage URL for fast download/view.
    Avoids proxying file bytes through our slow backend connection."""
    from fastapi.responses import RedirectResponse

    from backend.db.database import engine
    from backend.utils import get_supabase_client
    from sqlalchemy import text

    logger.info("download_file called — file_id=%s, user_id=%s, view=%s", file_id, user_id, view)

    # Use direct DB to fetch file metadata + verify ownership in one query
    with engine.connect() as conn:
        row = conn.execute(
            text(
                "SELECT f.*, c.user_id "
                "FROM files f "
                "JOIN companies c ON c.id = f.company_id "
                "WHERE f.id = :file_id"
            ),
            {"file_id": file_id},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="File not found.")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    bucket = row.get("bucket_name") or "company_files"
    storage_path = row.get("storage_path") or ""
    file_name = row.get("file_name") or ""
    original_name = row.get("original_file_name") or file_name or "file"

    # Normalize path: uploaded files store just the filename, generated store full path
    if "/" not in storage_path:
        storage_path = f"{row['company_id']}/{storage_path}"

    # Generate a signed URL (valid 5 min) and redirect the browser there directly.
    # This avoids downloading through our slow Supabase connection.
    try:
        supabase = get_supabase_client()
        signed = supabase.storage.from_(bucket).create_signed_url(
            path=storage_path,
            expires_in=300,  # 5 minutes
            options={"download": not view},  # attachment vs inline
        )
        signed_url = signed.get("signedURL") or signed.get("signed_url") or ""
        if signed_url:
            logger.info("Redirecting to signed URL — file_id=%s, bucket=%s", file_id, bucket)
            return RedirectResponse(url=signed_url, status_code=302)
    except Exception as exc:
        logger.warning("Signed URL failed, falling back to proxied download: %s", exc)

    # Fallback: download through our server (slow on free tier)
    from backend.db.put_to_drive import download_from_cloud

    content = download_from_cloud(
        company_id=row["company_id"],
        file_name=file_name,
        bucket_name=bucket,
        storage_path=storage_path,
    )
    if content is None:
        raise HTTPException(status_code=500, detail="Failed to retrieve file from storage.")

    from fastapi.responses import Response

    mime_type = row.get("mime_type") or "application/octet-stream"
    disposition = "inline" if view else "attachment"
    headers = {"Content-Disposition": f'{disposition}; filename="{original_name}"'}

    logger.info(
        "Serving file (fallback) — file_id=%s, name=%s, mime=%s, size=%d",
        file_id, original_name, mime_type, len(content),
    )
    return Response(content=content, media_type=mime_type, headers=headers)
import logging

from fastapi import APIRouter
from fastapi import FastAPI, HTTPException,Query
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
"""Connections API — list/disconnect third-party integrations.

Exposes the status of every integration a company can connect to, and the
handshake lifecycle (connect/disconnect) for the ones that are implemented.

The actual OAuth "connect" handshake lives in `backend/api/auth.py`
(`GET /auth/instagram/login` → Instagram → `GET /auth/instagram/callback`),
which stores the resulting token in the `instagram_connections` table.
This router is the read/disconnect surface the plugins page uses.
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from backend.db.connections import get_from_insta_table, delete_from_insta_table
from backend.db.get_from_sql import get_company_id

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/connections",
    tags=["Connections"],
)

# Catalog of integrations the app knows about. Only entries with
# `available=True` have a working OAuth handshake + token store behind them;
# the rest are surfaced so the frontend can render a full grid with
# "coming soon" affordances without hardcoding the list client-side.
_INTEGRATIONS: list[dict[str, Any]] = [
    {
        "id": "instagram",
        "name": "Instagram",
        "description": "Publish content and pull insights from Instagram",
        "available": True,
    },
    {
        "id": "google_sheets",
        "name": "Google Sheets",
        "description": "Sync data and reports from your spreadsheets",
        "available": False,
    },
    {
        "id": "google_drive",
        "name": "Google Drive",
        "description": "Search, read, and upload files instantly",
        "available": False,
    },
    {
        "id": "gmail",
        "name": "Gmail",
        "description": "Draft replies, summarize threads & search your inbox",
        "available": False,
    },
    {
        "id": "google_calendar",
        "name": "Google Calendar",
        "description": "Manage your schedule and coordinate meetings",
        "available": False,
    },
    {
        "id": "notion",
        "name": "Notion",
        "description": "Connect your Notion workspace to power workflows",
        "available": False,
    },
    {
        "id": "slack",
        "name": "Slack",
        "description": "Send messages and fetch Slack data",
        "available": False,
    },
    {
        "id": "shopify",
        "name": "Shopify",
        "description": "Orders & sales data",
        "available": False,
    },
]


def _instagram_status(company_id: int) -> dict[str, Any]:
    """Build the Instagram connection status payload for a company.

    The access token is deliberately NOT included — it is a secret that only
    the backend (agent tools) should ever see, never the browser.
    """
    row = get_from_insta_table(company_id)
    if not row:
        return {"connected": False}

    return {
        "connected": True,
        "instagram_user_id": row.get("instagram_user_id"),
        "expires_at": row.get("expires_at"),
        "created_at": row.get("created_at"),
    }


@router.get("")
def list_connections(user_id: int = Query(..., description="User ID")):
    """List every integration and whether the user's company has connected it."""
    company_id = get_company_id(user_id)
    if not company_id:
        logger.warning("No company found for user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")

    connections: list[dict[str, Any]] = []
    for integration in _INTEGRATIONS:
        item = {
            "id": integration["id"],
            "name": integration["name"],
            "description": integration["description"],
            "available": integration["available"],
            "connected": False,
        }
        if integration["id"] == "instagram":
            item.update(_instagram_status(company_id))
        connections.append(item)

    return {"connections": connections}


@router.get("/instagram")
def get_instagram_connection(user_id: int = Query(..., description="User ID")):
    """Status of the company's Instagram connection."""
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")

    return _instagram_status(company_id)


@router.delete("/instagram")
def disconnect_instagram(user_id: int = Query(..., description="User ID")):
    """Remove the company's Instagram connection (revokes our stored token)."""
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="No company found for this user. Complete onboarding first.")

    try:
        removed = delete_from_insta_table(company_id)
    except RuntimeError as exc:
        logger.exception("Failed to disconnect Instagram for company_id=%s", company_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not removed:
        logger.info("No Instagram connection to remove for company_id=%s", company_id)

    return {"status": "disconnected", "company_id": company_id}

import os
from urllib.parse import urlparse

import supabase
from dotenv import load_dotenv
import pymupdf
load_dotenv()


def _get_supabase_url() -> str:
    supabase_url = os.getenv("SUPABASE_URL")
    if supabase_url:
        return supabase_url

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        host = parsed.hostname or ""
        if host.startswith("db.") and host.endswith(".supabase.co"):
            project_ref = host.removeprefix("db.").removesuffix(".supabase.co")
            return f"https://{project_ref}.supabase.co"

    raise RuntimeError(
        "Missing SUPABASE_URL. Add SUPABASE_URL=https://<project-ref>.supabase.co "
        "to your .env file."
    )


def _get_supabase_key() -> str:
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABSE_SERVICE_ROLE_KEY")
    if not supabase_key:
        raise RuntimeError(
            "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env file. "
            "The old SUPABSE_SERVICE_ROLE_KEY spelling is also supported temporarily."
        )
    return supabase_key


supabase_client = supabase.Client(
    supabase_url=_get_supabase_url(),
    supabase_key=_get_supabase_key(),
)

def get_supabase_client():
    return supabase_client


def extract_text(content):
    from io import BytesIO
    doc = pymupdf.open(stream=BytesIO(content), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text
import asyncio
from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logger_config import setup_logging

# Configure the root logger before importing routers so application errors,
# including agent failures, are written to logs.log as well as the console.
setup_logging()

from backend.api.auth import router as auth_router
from backend.api.user import router as user_router
from backend.api.drive import router as drive_router
from backend.api.chat import router as chat_router
from backend.api.credits import router as credits_router
from backend.api.payments import router as payments_router
from backend.api.payment_history import router as payment_history_router
from backend.api.connections import router as connections_router
from backend.api.logo import router as logo_router
from backend.api.contact import router as contact_router
from backend.api.connection_manager import event_bus

logger = logging.getLogger(__name__)


def _log_connector_config() -> None:
    """Boot-time visibility for optional connectors.

    Without this, a missing OAuth credential is only discovered when a founder
    clicks Connect and gets a 500. Names only — never values.
    """
    from backend.field_crypto import encryption_enabled, key_fingerprint
    from connections.google.google_connection_manager import Google_Connection_Manager

    missing = Google_Connection_Manager().missing_config
    if missing:
        logger.warning(
            "Google connectors (Gmail, Sheets) disabled — missing env var(s): %s "
            "(see docs/technical.md → Google connection flow)",
            ", ".join(missing),
        )
    else:
        logger.info("Google connectors configured (Gmail, Sheets)")

    # The fingerprint identifies the active key without revealing it — the first
    # thing to check when a stored credential suddenly cannot be decrypted.
    # `field_crypto` has already warned if the key is missing entirely.
    if encryption_enabled():
        logger.info("Connector credentials encrypted at rest (key %s)", key_fingerprint())


@asynccontextmanager
async def lifespan(app: FastAPI):
    event_bus.set_event_loop(asyncio.get_running_loop())
    _log_connector_config()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(drive_router)
app.include_router(chat_router)
app.include_router(credits_router)
app.include_router(payments_router)
app.include_router(payment_history_router)
app.include_router(connections_router)
app.include_router(logo_router)
app.include_router(contact_router)

# Allowed browser origins — comma-separated list, env-configurable for deploy.
# Production (Vercel frontend on EC2 backend's .env):
# CORS_ORIGINS=https://get-cofounder.tech,https://www.get-cofounder.tech
# Localhost entries stay for local development.
_CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://get-cofounder.tech,https://www.get-cofounder.tech",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def read_health():
    return {"status": "all fine bruh!"}

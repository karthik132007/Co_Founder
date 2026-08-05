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

logger = logging.getLogger(__name__)

app = FastAPI()
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(drive_router)
app.include_router(chat_router)

# Allowed browser origins — comma-separated list, env-configurable for deploy.
# Example: CORS_ORIGINS=https://app.example.com,https://www.example.com
_CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
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

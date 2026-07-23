import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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


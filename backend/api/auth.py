import logging

from fastapi import APIRouter
from fastapi import HTTPException
from backend.models import UserCreate
from backend.db.insert_to_sql import create_user, authenticate_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login")
def login(user: UserCreate):
    logger.info("Login attempt for email=%s", user.email)
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        logger.info("Login successful for email=%s (id=%s)", user.email, authenticated.id)
        return {"id": authenticated.id, "email": authenticated.email, "message": "Login successful"}
    logger.warning("Login failed for email=%s — invalid credentials", user.email)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signup")
def signup(user: UserCreate):
    logger.info("Signup attempt for email=%s", user.email)
    created = create_user(email=user.email, password=user.password)
    if created:
        logger.info("Signup successful for email=%s (id=%s)", user.email, created.id)
        return {"id": created.id, "email": created.email, "message": "User created"}
    logger.warning("Signup failed for email=%s — email already exists", user.email)
    raise HTTPException(status_code=400, detail="Email already exists")
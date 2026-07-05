from fastapi import APIRouter
from fastapi import HTTPException
from backend.models import UserCreate
from backend.db.insert_to_sql import create_user, authenticate_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login")
def login(user: UserCreate):
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        return {"id": authenticated.id, "email": authenticated.email, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signup")
def signup(user: UserCreate):
    created = create_user(email=user.email, password=user.password)
    if created:
        return {"id": created.id, "email": created.email, "message": "User created"}
    raise HTTPException(status_code=400, detail="Email already exists")
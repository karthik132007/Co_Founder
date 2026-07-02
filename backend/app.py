from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import UserCreate, CompanyCreate
from .db.insert_to_sql import create_user, authenticate_user, create_company

app = FastAPI()

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

@app.post("/login")
def login(user: UserCreate):
    authenticated = authenticate_user(email=user.email, password=user.password)
    if authenticated:
        return {"id": authenticated.id, "email": authenticated.email, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/signup")
def signup(user: UserCreate):
    created = create_user(email=user.email, password=user.password)
    if created:
        return {"id": created.id, "email": created.email, "message": "User created"}
    raise HTTPException(status_code=400, detail="Email already exists")

@app.post("/user/onboarding")
def onboarding(company: CompanyCreate):
    tone = company.tone or "professional"
    allowed_tones = {"friendly", "professional", "witty"}

    if tone not in allowed_tones:
        raise HTTPException(status_code=422, detail="Tone must be friendly, professional, or witty")

    if len(company.small_description.split()) > 500:
        raise HTTPException(status_code=422, detail="Small description must be 500 words or less")

    created = create_company(
        company_name=company.company_name,
        small_description=company.small_description,
        industry=company.industry,
        tone=tone,
        user_id=company.user_id,
    )
    if created:
        return {"id": created.id, "company_name": created.company_name, "message": "Company created"}
    raise HTTPException(status_code=400, detail="Failed to create company")

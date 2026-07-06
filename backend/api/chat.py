from fastapi import APIRouter, Form
from fastapi import HTTPException
from main import chat
from backend.db.get_from_sql import get_company_id
router = APIRouter()

@router.post("/chat")
def chat_with_user(user_id: int = Form(...), message: str = Form(...)):
    company_id = get_company_id(user_id)
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")
    reply = chat(company_id, message)
    return {
        "status": "success",
        "message": reply
    }
    

from backend.models import CompanyData
import supabase
from backend.utils import get_supabase_client
supabase_client = get_supabase_client()

def get_company_data(company_id: int) -> CompanyData:

    response = supabase_client.table("companies").select("*").eq("id", company_id)
    return response.data[0] if response.data else None

def get_company_id(user_id: int):
    response = supabase_client.table("companies").select("id").eq("user_id", user_id)
    return response.data[0]["id"] if response.data else None

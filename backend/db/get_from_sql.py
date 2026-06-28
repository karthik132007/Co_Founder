from backend.models import CompanyData
import dotenv
dotenv.load_dotenv()
supabase_url = dotenv.get("SUPABASE_URL")
def get_company_data(company_id: int) -> CompanyData:
    pass

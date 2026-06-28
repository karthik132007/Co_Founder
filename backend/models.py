from pydantic import BaseModel

class CompanyData(BaseModel):
    company_name: str
    small_description: str
    industry: str
    tone: str
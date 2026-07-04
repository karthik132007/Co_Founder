import supabase
import os
supabase_url = os.getenv("DATABASE_URL")
supabase_key = os.getenv("SUPABSE_SERVICE_ROLE_KEY")
supabase_client = supabase.Client(supabase_url=supabase_url, supabase_key=supabase_key)

def get_supabase_client():
    return supabase_client
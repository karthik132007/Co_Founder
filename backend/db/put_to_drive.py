from backend.utils import get_supabase_client

client = get_supabase_client()


def upload_to_cloud(company_id: int,file: bytes,file_name:str,content_type: str):
    try:
        client.storage.from_("company_files").upload(
            path=f"{company_id}/{file_name}",
            file=file,
            file_options={"content-type": content_type,"upsert":True}
        )
        return {
            "status": True,
            "message": f"File uploaded to Cloud successfully",
        }
    except Exception as e:
        return{
            "status":False,
            "message":str(e)
        }

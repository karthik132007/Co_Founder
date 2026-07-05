from backend.utils import get_supabase_client

client = get_supabase_client()


# def upload_to_cloud(company_id: int,content: bytes,file_name:str,content_type: str):
#     try:
#         client.storage.from_("company_files").upload(
#             path=f"{company_id}/{file_name}",
#             file=content,
#             file_options={"content-type": content_type,"upsert":True}
#         )
#         return {
#             "status": True,
#             "message": f"File uploaded to Cloud successfully",
#         }
#     except Exception as e:
#         return{
#             "status":False,
#             "message":str(e)
#         }

def upload_to_cloud(company_id, content, file_name, content_type):
    try:
        response = client.storage.from_("company_files").upload(
            path=f"{company_id}/{file_name}",
            file=content,
            file_options={
                "content-type": content_type,
                "upsert": "true"
            }
        )

        # print("UPLOAD RESPONSE:", response)

        # files = client.storage.from_("company_files").list(str(company_id))
        # print("FILES:", files)

        return {
                    "status": True,
                   "message": f"File uploaded to Cloud successfully",
                 }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(e)

def delete_from_cloud(company_id: int, file_name: str):
    """Delete a file from cloud storage. Returns True if deleted, False on failure."""
    try:
        client.storage.from_("company_files").remove(
            paths=[f"{company_id}/{file_name}"]
        )
        return True
    except Exception as e:
        print(f"Error deleting from cloud: {e}")
        return False

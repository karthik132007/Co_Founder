import logging

from backend.utils import get_supabase_client

logger = logging.getLogger(__name__)

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
    logger.info("upload_to_cloud called — company_id=%s, file_name=%s, content_type=%s, size=%d", company_id, file_name, content_type, len(content))
    try:
        response = client.storage.from_("company_files").upload(
            path=f"{company_id}/{file_name}",
            file=content,
            file_options={
                "content-type": content_type,
                "upsert": "true"
            }
        )
        return {
                    "status": True,
                   "message": f"File uploaded to Cloud successfully",
                 }

    except Exception as e:
        logger.exception("Failed to upload file to cloud — company_id=%s, file_name=%s", company_id, file_name)
        return {
            "status": False,
            "message": str(e)
        }

def delete_from_cloud(company_id: int, file_name: str):
    """Delete a file from cloud storage. Returns True if deleted, False on failure."""
    try:
        client.storage.from_("company_files").remove(
            paths=[f"{company_id}/{file_name}"]
        )
        logger.info("File deleted from cloud — company_id=%s, file_name=%s", company_id, file_name)
        return True
    except Exception as e:
        logger.exception("Error deleting from cloud — company_id=%s, file_name=%s", company_id, file_name)
        return False


def download_from_cloud(company_id: int, file_name: str):
    """Download a file from cloud storage. Returns bytes, or None on failure."""
    try:
        data = client.storage.from_("company_files").download(
            path=f"{company_id}/{file_name}"
        )
        if data:
            logger.info("File downloaded from cloud — company_id=%s, file_name=%s, size=%d", company_id, file_name, len(data))
        else:
            logger.warning("File download returned no data — company_id=%s, file_name=%s", company_id, file_name)
        return data
    except Exception as e:
        logger.exception("Error downloading from cloud — company_id=%s, file_name=%s", company_id, file_name)
        return None

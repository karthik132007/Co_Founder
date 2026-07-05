from fastapi import APIRouter,HTTPException,UploadFile,Query,Path
from backend.db.delete_from_sql import delete_file_by_id
from backend.db.put_to_drive import upload_to_cloud, delete_from_cloud
from agents.util_agents.description_genrator import get_file_description
from uuid import uuid4
from agents.util_agents.image_description import get_image_description
from backend.db.insert_to_sql import add_meta_to_file
from backend.db.get_from_sql import get_company_id
from backend.utils import extract_text
from backend.utils import get_supabase_client
from backend.models import CompanyCreate

router = APIRouter()


@router.post("/upload")
def upload_to_drive(user_id: int, file: UploadFile):
    company_id = get_company_id(user_id)
    try:
        file_bytes = file.file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        file_type = file.content_type or "application/octet-stream"

        if file.content_type.startswith("image/"):
            file_desc = get_image_description(file_bytes, file_type)

        else:
            extracted_content = extract_text(file_bytes)
            file_desc = get_file_description(extracted_content)

        unique_name = f"{uuid4()}_{file.filename}"

        upload_to_cloud(
            company_id=company_id,
            content=file_bytes,
            file_name=unique_name,
            content_type=file_type
        )

        # TODO: Store file_desc in the database
        add_meta_to_file(
            company_id=company_id,
            file_name=unique_name,
            original_file_name=file.filename,
            storage_path=unique_name,  # Adjust this based on your cloud storage logic
            mime_type=file_type,
            description=file_desc
        )

        return {
            "message": "File uploaded successfully",
            "file_name": unique_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.delete("/file/{file_id}")
def delete_file(user_id: int = Query(..., description="User ID"), file_id: int = Path(..., description="File ID")):
    """Delete a file from cloud storage and database.

    ⚠️ WARNING: This action cannot be undone. The file will be permanently deleted.
    """
    try:
        company_id = get_company_id(user_id)
        if not company_id:
            raise HTTPException(status_code=404, detail="No company found for this user.")

        supabase_client = get_supabase_client()

        # Get file details from database
        file_data = supabase_client.table("files").select("*").eq("id", file_id).eq("company_id", company_id).execute()

        if not file_data.data:
            raise HTTPException(status_code=404, detail="File not found or does not belong to this user.")

        file_record = file_data.data[0]
        file_name = file_record.get("file_name")

        # Delete from cloud storage
        delete_from_cloud(company_id, file_name)

        # Delete from database
        delete_file_by_id(file_id)

        return {
            "message": "File deleted successfully",
            "file_id": file_id,
            "warning": "This action cannot be undone"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

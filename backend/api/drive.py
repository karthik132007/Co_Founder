from pathlib import Path as FilePath
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Path, Query, UploadFile

from RAG_Engine.chunking import chunk_document_text
from agents.util_agents.description_genrator import get_file_description
from agents.util_agents.image_description import get_image_description
from backend.db.delete_from_sql import delete_file_by_id
from backend.db.get_from_sql import get_company_id
from backend.db.insert_to_sql import add_document_chunks, add_meta_to_file
from backend.db.put_to_drive import delete_from_cloud, upload_to_cloud
from backend.utils import get_supabase_client
from backend.utils import extract_text

router = APIRouter()


@router.post("/upload")
def upload_to_drive(user_id: int, file: UploadFile):
    company_id = get_company_id(user_id)
    try:
        if not company_id:
            raise HTTPException(status_code=404, detail="No company found for this user.")

        file_bytes = file.file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        file_type = file.content_type or "application/octet-stream"
        original_file_name = file.filename or "uploaded_file"
        file_extension = FilePath(original_file_name).suffix.lstrip(".") or None
        document_chunks = []

        data_extensions = {"csv", "xlsx", "xls", "parquet"}

        if file_type.startswith("image/"):
            file_desc = get_image_description(file_bytes, file_type)

        elif file_extension in data_extensions:
            # Data files: description only (from a content sample), no chunking/RAG.
            sample = file_bytes[:8000].decode("utf-8", errors="replace")
            file_desc = get_file_description(sample)

        else:
            extracted_content = extract_text(
                file_bytes,
                file_extension=file_extension,
                mime_type=file_type,
            )
            file_desc = get_file_description(extracted_content)
            document_chunks = chunk_document_text(
                text=extracted_content,
                file_path=original_file_name,
            )

        unique_name = f"{uuid4()}_{original_file_name}"

        upload_to_cloud(
            company_id=company_id,
            content=file_bytes,
            file_name=unique_name,
            content_type=file_type
        )

        file_record = add_meta_to_file(
            company_id=company_id,
            file_name=unique_name,
            original_file_name=original_file_name,
            storage_path=unique_name,  # Adjust this based on your cloud storage logic
            mime_type=file_type,
            description=file_desc,
            file_extension=file_extension,
            file_size=len(file_bytes),
        )

        if document_chunks:
            add_document_chunks(
                file_id=file_record.id,
                company_id=company_id,
                chunks=document_chunks,
                original_file_name=original_file_name,
                mime_type=file_type,
            )

        return {
            "message": "File uploaded successfully",
            "file_name": unique_name,
            "chunks_stored": len(document_chunks),
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
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

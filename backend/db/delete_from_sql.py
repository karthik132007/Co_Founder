from backend.db.database import SessionLocal
from backend.models import File
def delete_file_by_id(file_id: int):
    """Delete a file from the database by ID. Returns True if deleted, False if not found."""
    db = SessionLocal()
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            return False
        db.delete(file)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

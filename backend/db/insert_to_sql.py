from .database import SessionLocal
from ..models import User, Company, File
from sqlalchemy.exc import IntegrityError


def create_user(email: str, password: str):
    """Create a new user and return the SQLAlchemy user object.
    Returns None if the email already exists.
    """
    db = SessionLocal()
    try:
        user = User(email=email, password=password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        return None
    finally:
        db.close()


def get_user_by_email(email: str):
    """Return a User by email or None."""
    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def authenticate_user(email: str, password: str):
    """Authenticate credentials; return user if valid, else None."""
    user = get_user_by_email(email)
    if user and user.password == password:
        return user
    return None


def create_company(company_name: str, small_description: str, industry: str, user_id: int, tone: str = None):
    """Create a company associated with a user. Returns Company or None on failure."""
    db = SessionLocal()
    try:
        company = Company(
            company_name=company_name,
            small_description=small_description,
            industry=industry,
            tone=tone,
            user_id=user_id,
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    except Exception:
        db.rollback()
        return None
    finally:
        db.close()

def add_meta_to_file(
    company_id: int,
    file_name: str,
    original_file_name: str,
    storage_path: str,
    mime_type: str,
    bucket_name: str = "company_files",
    description: str = None,
    file_extension: str = None,
    file_size: int = None,
    status: str = "ready",
):
    """Insert file metadata into the files table. Returns File object or None on failure."""
    db = SessionLocal()
    try:
        file = File(
            company_id=company_id,
            file_name=file_name,
            original_file_name=original_file_name,
            bucket_name=bucket_name,
            storage_path=storage_path,
            description=description,
            mime_type=mime_type,
            file_extension=file_extension,
            file_size=file_size,
            status=status,
        )
        db.add(file)
        db.commit()
        db.refresh(file)
        return file
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

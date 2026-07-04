from pydantic import BaseModel
from .db.database import Base
from sqlalchemy import Column, BigInteger, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from typing import Optional
from datetime import datetime


class CompanyData(BaseModel):
    id: int
    company_name: str
    small_description: str
    industry: str
    tone: Optional[str] = None


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(Text, unique=True, nullable=False)
    password = Column(Text, nullable=False)

    # relationship to companies
    companies = relationship("Company", back_populates="user", passive_deletes=True)


class UserCreate(BaseModel):
    email: str
    password: str


class Company(Base):
    __tablename__ = "companies"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_name = Column(Text, nullable=False)
    small_description = Column(Text, nullable=False)
    industry = Column(Text, nullable=False)
    tone = Column(Text, nullable=True)

    # Allow NULL on delete to match ON DELETE SET NULL
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user = relationship("User", back_populates="companies")


class CompanyCreate(BaseModel):
    company_name: str
    small_description: str
    industry: str
    tone: Optional[str] = None
    user_id: int


class File(Base):
    __tablename__ = "files"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
    original_file_name = Column(Text, nullable=False)
    bucket_name = Column(Text, nullable=False, default="company_files")
    storage_path = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    mime_type = Column(Text, nullable=False)
    file_extension = Column(Text, nullable=True)
    file_size = Column(BigInteger, nullable=True)
    status = Column(Text, nullable=False, default="ready")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    company = relationship("Company", passive_deletes=True)


class FileCreate(BaseModel):
    company_id: int
    file_name: str
    original_file_name: str
    bucket_name: str = "company_files"
    storage_path: str
    description: Optional[str] = None
    mime_type: str
    file_extension: Optional[str] = None
    file_size: Optional[int] = None
    status: str = "ready"

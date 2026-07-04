from pydantic import BaseModel
from .db.database import Base
from sqlalchemy import Column, BigInteger, Text, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional


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

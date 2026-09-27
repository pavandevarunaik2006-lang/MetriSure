"""
MetriSure — Database Models: User
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.core.database import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="TECHNICIAN")
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

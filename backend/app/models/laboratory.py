"""
MetriSure — Database Models: Laboratory
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, func
from app.core.database import Base, TimestampMixin


class Laboratory(Base, TimestampMixin):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default="India")
    accreditation_number = Column(String(100))
    accreditation_valid_until = Column(Date)
    contact_person = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Laboratory {self.name} ({self.code})>"

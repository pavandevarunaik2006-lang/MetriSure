"""
MetriSure — Database Models: SystemSetting
"""
from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base, TimestampMixin


class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    description = Column(String(255), nullable=True)

    def __repr__(self):
        return f"<SystemSetting {self.key}={self.value}>"

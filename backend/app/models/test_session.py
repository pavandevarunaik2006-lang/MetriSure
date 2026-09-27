"""
MetriSure — Database Models: Test Session
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class TestSession(Base, TimestampMixin):
    """Official container for a NAWI type-evaluation run."""
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_number = Column(String(50), unique=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    laboratory_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rulepack_version = Column(String(50), nullable=False)
    
    # Status workflow
    status = Column(String(50), default="DRAFT")
    # DRAFT → READY → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → 
    # CORRECTION_REQUIRED / RETEST_REQUIRED / APPROVED → COMPLETED
    
    # Environmental conditions
    env_temperature = Column(Float)  # °C
    env_humidity = Column(Float)     # %RH
    env_atmospheric_pressure = Column(Float)  # hPa
    env_temperature_start = Column(Float)
    env_temperature_end = Column(Float)
    env_humidity_start = Column(Float)
    env_humidity_end = Column(Float)
    env_notes = Column(Text)
    
    # Timestamps
    started_at = Column(DateTime)
    submitted_at = Column(DateTime)
    reviewed_at = Column(DateTime)
    approved_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    instrument = relationship("Instrument", back_populates="test_sessions")
    laboratory = relationship("Laboratory")
    test_cases = relationship("TestCase", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="session")

    def __repr__(self):
        return f"<TestSession {self.session_number} [{self.status}]>"

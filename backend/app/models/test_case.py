"""
MetriSure — Database Models: TestCase, Observation, Calculation
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class TestCase(Base, TimestampMixin):
    """A specific test within a test session (e.g., Linearity, Repeatability)."""
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    test_type = Column(String(50), nullable=False)
    # LINEARITY, REPEATABILITY, ECCENTRICITY, DISCRIMINATION, ZERO_SETTING, TARE, SENSITIVITY, TILT
    test_name = Column(String(255), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    status = Column(String(50), default="PENDING")
    # PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    overall_result = Column(String(20))  # PASS, FAIL
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)

    # Relationships
    session = relationship("TestSession", back_populates="test_cases")
    observations = relationship("Observation", back_populates="test_case", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestCase {self.test_type} [{self.status}]>"


class Observation(Base, TimestampMixin):
    """A single measurement observation within a test case."""
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    test_point_label = Column(String(100))
    
    # Reference values
    reference_value = Column(Float, nullable=False)
    reference_unit = Column(String(20), default="kg")
    
    # Observed values
    indicated_value = Column(Float, nullable=False)
    indicated_unit = Column(String(20), default="kg")
    
    # Changeover point method values
    fractional_weight_delta_l = Column(Float, default=0.0)
    actual_interval_d = Column(Float)
    
    # Calculated values (populated by compliance engine)
    corrected_indication = Column(Float)
    calculated_error = Column(Float)
    corrected_error = Column(Float)
    zero_error = Column(Float, default=0.0)
    permissible_error = Column(Float)
    result = Column(String(20))  # PASS, FAIL
    
    # Input metadata
    input_method = Column(String(20), default="MANUAL")  # MANUAL, IMPORTED, DEMO
    source_file = Column(String(255))
    source_row = Column(Integer)
    operator_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, server_default=func.now())
    notes = Column(Text)
    
    # Direction for linearity test
    direction = Column(String(20), default="INCREASING")  # INCREASING, DECREASING

    # Relationships
    test_case = relationship("TestCase", back_populates="observations")
    calculations = relationship("Calculation", back_populates="observation")
    evidence_items = relationship("Evidence", back_populates="observation")

    def __repr__(self):
        return f"<Observation #{self.sequence_number} ref={self.reference_value} ind={self.indicated_value}>"


class Calculation(Base, TimestampMixin):
    """Official calculation record from the Deterministic Compliance Engine."""
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    
    # Calculation results
    corrected_indication = Column(Float)
    raw_error = Column(Float)
    corrected_error = Column(Float)
    zero_error = Column(Float, default=0.0)
    permissible_error = Column(Float)
    
    # Rule applied
    rule_identifier = Column(String(100))
    comparison_operator = Column(String(10), default="<=")
    result = Column(String(20))  # PASS, FAIL
    explanation = Column(Text)
    
    # Version tracking
    engine_version = Column(String(20), nullable=False)
    rulepack_version = Column(String(50), nullable=False)

    # Relationships
    observation = relationship("Observation", back_populates="calculations")

    def __repr__(self):
        return f"<Calculation obs={self.observation_id} result={self.result}>"

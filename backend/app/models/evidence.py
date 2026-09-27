"""
MetriSure — Database Models: Evidence, Report, Approval, Audit, RulePack, Simulation
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON, Date, func
from sqlalchemy.orm import relationship
from app.core.database import Base, TimestampMixin


class Evidence(Base, TimestampMixin):
    """Evidence file (photo, document) linked to observations."""
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sha256_hash = Column(String(64))
    
    # VisualProof fields
    ocr_result = Column(String(255))
    ocr_confidence = Column(Float)
    verification_status = Column(String(50), default="PENDING")
    # PENDING, MATCH, MISMATCH, OCR_UNCERTAIN, VERIFIED, MISSING

    # Human Review Disposition fields
    review_disposition = Column(String(50), default="REVIEW PENDING")  # REVIEW PENDING, REVIEWED — ACCEPTED, REVIEWED — REJECTED
    reviewer_name = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Relationships
    observation = relationship("Observation", back_populates="evidence_items")

    def __repr__(self):
        return f"<Evidence {self.file_name} [{self.verification_status}] [{self.review_disposition}]>"


class RuleVersion(Base, TimestampMixin):
    """Versioned RulePack for compliance evaluation."""
    __tablename__ = "rule_versions"

    id = Column(Integer, primary_key=True, index=True)
    standard = Column(String(100), default="OIML R-76")
    standard_version = Column(String(50), default="2006")
    pack_version = Column(String(50), nullable=False)
    accuracy_class = Column(String(10))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="DRAFT")  # DRAFT, UNDER_REVIEW, APPROVED, RETIRED
    effective_date = Column(Date)
    is_demo = Column(Boolean, default=True)
    parameters = Column(JSON)  # Full RulePack configuration
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))

    def __repr__(self):
        return f"<RuleVersion {self.name} v{self.pack_version} [{self.status}]>"


class Report(Base, TimestampMixin):
    """Generated test report."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    report_number = Column(String(50), unique=True, nullable=False)
    version = Column(Integer, default=1)
    status = Column(String(50), default="DRAFT")  # DRAFT, UNDER_REVIEW, APPROVED, AMENDED
    file_path = Column(String(500))
    sha256_hash = Column(String(64))
    generated_by = Column(Integer, ForeignKey("users.id"))
    generated_at = Column(DateTime, server_default=func.now())
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    
    # Relationships
    session = relationship("TestSession", back_populates="reports")
    versions = relationship("ReportVersion", back_populates="report", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Report {self.report_number} v{self.version} [{self.status}]>"


class ReportVersion(Base, TimestampMixin):
    """Version history for reports."""
    __tablename__ = "report_versions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    version = Column(Integer, nullable=False)
    changes_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String(500))
    sha256_hash = Column(String(64))
    
    # Relationships
    report = relationship("Report", back_populates="versions")


class ApprovalRecord(Base, TimestampMixin):
    """Records of review and approval actions."""
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    # SUBMITTED, REVIEWED, CORRECTION_REQUESTED, RETEST_REQUESTED, APPROVED, REJECTED
    notes = Column(Text)


class AuditLog(Base):
    """Immutable audit trail."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255))
    user_role = Column(String(50))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(50))
    details = Column(JSON)
    ip_address = Column(String(50))
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}:{self.entity_id}>"


class Simulation(Base, TimestampMixin):
    """What-If simulation records — always isolated from official data."""
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text)
    modified_observations = Column(JSON)  # Changed inputs
    original_result = Column(String(20))  # PASS/FAIL
    simulated_result = Column(String(20))  # PASS/FAIL
    engine_version = Column(String(20))
    rulepack_version = Column(String(50))

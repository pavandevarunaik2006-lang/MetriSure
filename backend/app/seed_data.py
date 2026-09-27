from app.core.security import get_password_hash
from app.models.user import User
from app.models.laboratory import Laboratory
from app.models.instrument import InstrumentModel, Instrument
from app.models.test_session import TestSession
from app.models.test_case import TestCase, Observation
from app.models.evidence import RuleVersion, Evidence, Report, AuditLog
from app.models.notification import Notification
from app.compliance.engine import ComplianceEngine, ObservationInput
from app.services.test_plan import generate_test_plan
from datetime import datetime
import hashlib
import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from app.core.config import settings

def ensure_session_demo_evidence(db, session, uploader_id: int = None):
    """Ensure a test session has the 3 mock images and text log evidence attached."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    if not uploader_id:
        tech = db.query(User).filter(User.role == "TECHNICIAN").first()
        uploader_id = tech.id if tech else 1

    obs_10kg = db.query(Observation).join(TestCase).filter(
        TestCase.session_id == session.id,
        Observation.reference_value == 10.0
    ).first()

    def _ensure_file_and_get_hash(filename: str):
        target_path = os.path.join(upload_dir, filename)
        if not os.path.exists(target_path):
            alt_paths = [
                os.path.join("..", "frontend", "public", "demo_evidence", filename),
                os.path.join("frontend", "public", "demo_evidence", filename),
                os.path.join("uploads", filename),
                os.path.join("..", "uploads", filename),
                os.path.join("backend", "uploads", filename),
            ]
            for ap in alt_paths:
                if os.path.exists(ap):
                    shutil.copy2(ap, target_path)
                    break
        if os.path.exists(target_path):
            with open(target_path, "rb") as f:
                data = f.read()
            return target_path, len(data), hashlib.sha256(data).hexdigest()
        return target_path, 0, ""

    from datetime import datetime
    is_approved_session = session.status == "APPROVED" or session.session_number == "TS-1045"
    default_disp = "REVIEWED — ACCEPTED" if is_approved_session else "REVIEW PENDING"
    default_reviewer = "Rajesh Kumar (reviewer@metrisure.demo)" if is_approved_session else None
    default_date = datetime.utcnow() if is_approved_session else None
    default_notes = "Parallax offset in optical capture verified on bench. Scale calibration re-confirmed compliant within OIML R-76 tolerances." if is_approved_session else None

    # 1. Existing demo display capture text file
    ev_txt = db.query(Evidence).filter(Evidence.session_id == session.id, Evidence.file_name == "demo_display_capture.txt").first()
    if not ev_txt:
        evidence_path = os.path.join(upload_dir, "demo_visualproof.txt")
        if not os.path.exists(evidence_path):
            with open(evidence_path, "w", encoding="utf-8") as f:
                f.write("DEMO DISPLAY CAPTURE\nExpected: 10.000 kg\nCaptured: 10.005 kg\nDEMO DATA — FOR DEMONSTRATION ONLY\n")
        content = open(evidence_path, "rb").read()
        db.add(Evidence(
            session_id=session.id,
            observation_id=obs_10kg.id if obs_10kg else None,
            test_case_id=obs_10kg.test_case_id if obs_10kg else None,
            file_name="demo_display_capture.txt",
            file_path=evidence_path,
            file_type="text/plain",
            file_size=len(content),
            uploader_id=uploader_id,
            sha256_hash=hashlib.sha256(content).hexdigest(),
            ocr_result="10.005 kg",
            ocr_confidence=0.91,
            verification_status="MISMATCH",
            review_disposition=default_disp,
            reviewer_name=default_reviewer,
            reviewed_at=default_date,
            review_notes=default_notes,
        ))
        db.commit()
    else:
        if is_approved_session and ev_txt.review_disposition != "REVIEWED — ACCEPTED":
            ev_txt.review_disposition = default_disp
            ev_txt.reviewer_name = default_reviewer
            ev_txt.reviewed_at = default_date
            ev_txt.review_notes = default_notes
            db.commit()

    # 2. IMAGE 1 — DIGITAL DISPLAY (Mismatch: Expected 10.000 kg, Captured 10.005 kg)
    ev_disp = db.query(Evidence).filter(Evidence.session_id == session.id, Evidence.file_name == "demo_display_10_005kg.jpg").first()
    if not ev_disp:
        fpath, fsize, fhash = _ensure_file_and_get_hash("demo_display_10_005kg.jpg")
        db.add(Evidence(
            session_id=session.id,
            observation_id=obs_10kg.id if obs_10kg else None,
            test_case_id=obs_10kg.test_case_id if obs_10kg else None,
            file_name="demo_display_10_005kg.jpg",
            file_path=fpath,
            file_type="image/jpeg",
            file_size=fsize,
            uploader_id=uploader_id,
            sha256_hash=fhash,
            ocr_result="10.005 kg",
            ocr_confidence=0.98,
            verification_status="MISMATCH",
            review_disposition=default_disp,
            reviewer_name=default_reviewer,
            reviewed_at=default_date,
            review_notes=default_notes,
        ))
        db.commit()
    else:
        ev_disp.verification_status = "MISMATCH"
        ev_disp.ocr_result = "10.005 kg"
        if is_approved_session:
            ev_disp.review_disposition = default_disp
            ev_disp.reviewer_name = default_reviewer
            ev_disp.reviewed_at = default_date
            ev_disp.review_notes = default_notes
        db.commit()

    # 3. IMAGE 2 — INSTRUMENT NAMEPLATE (Matches registered metadata)
    if not db.query(Evidence).filter(Evidence.session_id == session.id, Evidence.file_name == "demo_nameplate_sn001.jpg").first():
        fpath, fsize, fhash = _ensure_file_and_get_hash("demo_nameplate_sn001.jpg")
        db.add(Evidence(
            session_id=session.id,
            observation_id=None,
            test_case_id=None,
            file_name="demo_nameplate_sn001.jpg",
            file_path=fpath,
            file_type="image/jpeg",
            file_size=fsize,
            uploader_id=uploader_id,
            sha256_hash=fhash,
            ocr_result="DemoTech Industries | DT-3000 | SN-DEMO-001 | Class III | Max: 30kg | Min: 0.1kg | e=0.01kg",
            ocr_confidence=0.99,
            verification_status="MATCH",
        ))
        db.commit()
    else:
        ev_np = db.query(Evidence).filter(Evidence.session_id == session.id, Evidence.file_name == "demo_nameplate_sn001.jpg").first()
        if ev_np and ev_np.verification_status != "MATCH":
            ev_np.verification_status = "MATCH"
            db.commit()

    # 4. IMAGE 3 — TEST SETUP (Supporting laboratory calibration bench evidence)
    if not db.query(Evidence).filter(Evidence.session_id == session.id, Evidence.file_name == "demo_test_setup.jpg").first():
        fpath, fsize, fhash = _ensure_file_and_get_hash("demo_test_setup.jpg")
        db.add(Evidence(
            session_id=session.id,
            observation_id=None,
            test_case_id=None,
            file_name="demo_test_setup.jpg",
            file_path=fpath,
            file_type="image/jpeg",
            file_size=fsize,
            uploader_id=uploader_id,
            sha256_hash=fhash,
            ocr_result="Calibration Bench Verified | Ambient: 22.5°C / 45% RH | Weights: Class F1 Stainless Steel",
            ocr_confidence=0.95,
            verification_status="VERIFIED",
        ))
        db.commit()

def seed_demo_data(db):
    """Idempotent demo seed. Never drops existing records."""
    pwd = get_password_hash("demo123")
    demo_users = [
        {"email": "technician@metrisure.demo", "full_name": "Priya Sharma", "role": "TECHNICIAN"},
        {"email": "reviewer@metrisure.demo", "full_name": "Rajesh Kumar", "role": "REVIEWER"},
        {"email": "approver@metrisure.demo", "full_name": "Dr. Anita Desai", "role": "APPROVER"},
        {"email": "admin@metrisure.demo", "full_name": "Vikram Singh", "role": "ADMINISTRATOR"},
    ]
    users_by_email = {}
    for spec in demo_users:
        user = db.query(User).filter(User.email == spec["email"]).first()
        if not user:
            user = User(email=spec["email"], hashed_password=pwd, full_name=spec["full_name"], role=spec["role"], is_active=True)
            db.add(user)
            db.flush()
        users_by_email[spec["email"]] = user
    db.commit()

    lab = db.query(Laboratory).filter(Laboratory.code == "NML-MUM").first()
    if not lab:
        lab = Laboratory(
            name="National Metrology Lab Mumbai",
            address="Bandra-Kurla Complex",
            city="Mumbai",
            state="Maharashtra",
            code="NML-MUM",
            contact_email="nml@metrisure.demo",
            contact_phone="+91-22-1234567",
            is_active=True,
        )
        db.add(lab)
        db.commit()

    if db.query(Laboratory).count() < 3:
        for spec in [
            dict(name="Regional Testing Lab Delhi", address="Connaught Place", city="Delhi", state="Delhi", code="RTL-DEL", contact_email="rtl@metrisure.demo", contact_phone="+91-11-2345678"),
            dict(name="State Metrology Lab Bangalore", address="Koramangala", city="Bangalore", state="Karnataka", code="SML-BLR", contact_email="sml@metrisure.demo", contact_phone="+91-80-3456789"),
        ]:
            if not db.query(Laboratory).filter(Laboratory.code == spec["code"]).first():
                db.add(Laboratory(**spec, is_active=True))
        db.commit()

    model = db.query(InstrumentModel).filter(InstrumentModel.model_identifier == "DT3000-III-2023").first()
    if not model:
        model = InstrumentModel(
            manufacturer_name="DemoTech Industries",
            model_name="DT-3000",
            model_identifier="DT3000-III-2023",
            accuracy_class="III",
            max_capacity=30.0,
            min_capacity=0.1,
            verification_interval_e=0.01,
            actual_interval_d=0.01,
        )
        db.add(model)
        db.commit()

    inst = db.query(Instrument).filter(Instrument.serial_number == "SN-DEMO-001").first()
    if not inst:
        inst = Instrument(
            model_id=model.id,
            serial_number="SN-DEMO-001",
            year_of_manufacture=2023,
            laboratory_id=lab.id,
            status="ACTIVE",
            notes="DEMO DATA — FOR DEMONSTRATION ONLY",
        )
        db.add(inst)
        db.commit()

    # Instrument 2: SN-DEMO-002 (WT-5000, DemoScale Systems, Class III, 50 kg, e=0.01 kg)
    model2 = db.query(InstrumentModel).filter(InstrumentModel.model_identifier == "WT5000-III-2023").first()
    if not model2:
        model2 = InstrumentModel(
            manufacturer_name="DemoScale Systems",
            model_name="WT-5000",
            model_identifier="WT5000-III-2023",
            accuracy_class="III",
            max_capacity=50.0,
            min_capacity=0.2,
            verification_interval_e=0.01,
            actual_interval_d=0.01,
        )
        db.add(model2)
        db.commit()

    inst2 = db.query(Instrument).filter(Instrument.serial_number == "SN-DEMO-002").first()
    if not inst2:
        inst2 = Instrument(
            model_id=model2.id,
            serial_number="SN-DEMO-002",
            year_of_manufacture=2023,
            laboratory_id=lab.id,
            status="ACTIVE",
            notes="DEMO DATA — FOR DEMONSTRATION ONLY",
        )
        db.add(inst2)
        db.commit()

    # Instrument 3: SN-DEMO-003 (WM-200, DemoMeasure Labs, Class II, 10 kg, e=0.001 kg)
    model3 = db.query(InstrumentModel).filter(InstrumentModel.model_identifier == "WM200-II-2023").first()
    if not model3:
        model3 = InstrumentModel(
            manufacturer_name="DemoMeasure Labs",
            model_name="WM-200",
            model_identifier="WM200-II-2023",
            accuracy_class="II",
            max_capacity=10.0,
            min_capacity=0.05,
            verification_interval_e=0.001,
            actual_interval_d=0.001,
        )
        db.add(model3)
        db.commit()

    inst3 = db.query(Instrument).filter(Instrument.serial_number == "SN-DEMO-003").first()
    if not inst3:
        inst3 = Instrument(
            model_id=model3.id,
            serial_number="SN-DEMO-003",
            year_of_manufacture=2024,
            laboratory_id=lab.id,
            status="ACTIVE",
            notes="DEMO DATA — FOR DEMONSTRATION ONLY",
        )
        db.add(inst3)
        db.commit()

    rv = db.query(RuleVersion).filter(RuleVersion.pack_version == "1.0.0").first()
    if not rv:
        rv = RuleVersion(
            pack_version="1.0.0",
            name="DEMO RULEPACK — Class III NAWI",
            description="DEMO RULEPACK - NOT AUTHORITATIVE. Based on OIML R-76 for demonstration.",
            accuracy_class="III",
            status="APPROVED",
            is_demo=True,
        )
        db.add(rv)
        db.commit()

    tech = users_by_email["technician@metrisure.demo"]
    session = db.query(TestSession).filter(TestSession.session_number == "TS-1045").first()
    if not session:
        session = TestSession(
            instrument_id=inst.id,
            session_number="TS-1045",
            laboratory_id=lab.id,
            status="COMPLETED",
            operator_id=tech.id,
            rulepack_version="1.0.0",
            env_temperature=22.5,
            env_humidity=45.0,
            env_atmospheric_pressure=1013.25,
            started_at=datetime.utcnow(),
        )
        db.add(session)
        db.commit()

    if db.query(TestCase).filter(TestCase.session_id == session.id).count() == 0:
        generate_test_plan(db, session.id)

    engine = ComplianceEngine()
    cases = db.query(TestCase).filter(TestCase.session_id == session.id).all()
    demo_loads = [5.0, 10.0, 15.0]
    for tc in cases:
        if db.query(Observation).filter(Observation.test_case_id == tc.id).count() > 0:
            continue
        failed_any = False
        for idx, load in enumerate(demo_loads, start=1):
            indicated = load if tc.test_type != "ECCENTRICITY" or idx != 3 else load + 0.002
            result = engine.evaluate_observation(ObservationInput(
                indicated_value=indicated,
                reference_value=load,
                actual_interval_d=model.actual_interval_d,
                verification_interval_e=model.verification_interval_e,
                accuracy_class=model.accuracy_class,
                test_type=tc.test_type,
                unit="kg",
            ))
            obs = Observation(
                test_case_id=tc.id,
                sequence_number=idx,
                test_point_label=f"{tc.test_type}-{idx}",
                reference_value=load,
                indicated_value=indicated,
                actual_interval_d=model.actual_interval_d,
                calculated_error=result.raw_error,
                corrected_error=result.corrected_error,
                permissible_error=result.permissible_error,
                zero_error=result.zero_error,
                corrected_indication=result.corrected_indication,
                result=result.result,
                notes="DEMO DATA — FOR DEMONSTRATION ONLY",
                operator_id=tech.id,
                input_method="DEMO",
            )
            db.add(obs)
            if result.result == "FAIL":
                failed_any = True
        tc.status = "COMPLETED"
        tc.overall_result = "FAIL" if failed_any else "PASS"
    db.commit()

    # Ensure TS-1045 has APPROVED status for the primary golden demo path
    if session.status != "APPROVED":
        session.status = "APPROVED"
        db.commit()

    ensure_session_demo_evidence(db, session, tech.id)

    # Also ensure INV-TEST-7f9517 has observations and mock image evidence attached if present
    inv_session = db.query(TestSession).filter(TestSession.session_number == "INV-TEST-7f9517").first()
    if inv_session:
        cases_inv = db.query(TestCase).filter(TestCase.session_id == inv_session.id).all()
        for tc in cases_inv:
            if db.query(Observation).filter(Observation.test_case_id == tc.id).count() == 0:
                for idx, load in enumerate([5.0, 10.0, 15.0], start=1):
                    res = engine.evaluate_observation(ObservationInput(
                        indicated_value=load,
                        reference_value=load,
                        actual_interval_d=model.actual_interval_d,
                        verification_interval_e=model.verification_interval_e,
                        accuracy_class=model.accuracy_class,
                        test_type=tc.test_type,
                        unit="kg",
                    ))
                    db.add(Observation(
                        test_case_id=tc.id,
                        sequence_number=idx,
                        test_point_label=f"{tc.test_type}-{idx}",
                        reference_value=load,
                        indicated_value=load,
                        actual_interval_d=model.actual_interval_d,
                        calculated_error=res.raw_error,
                        corrected_error=res.corrected_error,
                        permissible_error=res.permissible_error,
                        zero_error=res.zero_error,
                        corrected_indication=res.corrected_indication,
                        result=res.result,
                        notes="DEMO DATA — FOR DEMONSTRATION ONLY",
                        operator_id=tech.id,
                        input_method="DEMO",
                    ))
                db.commit()
        ensure_session_demo_evidence(db, inv_session, tech.id)

    if db.query(Report).filter(Report.session_id == session.id).count() == 0:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        report_number = "TR-DEMO-1045"
        file_path = os.path.join(settings.UPLOAD_DIR, f"{report_number}.pdf")
        c = canvas.Canvas(file_path, pagesize=letter)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, 750, "STANDARDIZED TEST REPORT")
        c.setFont("Helvetica", 11)
        c.drawString(50, 720, "DEMO RULEPACK — NOT AUTHORITATIVE")
        c.drawString(50, 705, "DEMO DATA — FOR DEMONSTRATION ONLY")
        c.drawString(50, 670, f"Report Number: {report_number}")
        c.drawString(50, 650, f"Session: {session.session_number}")
        c.drawString(50, 630, f"Instrument: {inst.serial_number}")
        c.save()
        with open(file_path, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        db.add(Report(
            session_id=session.id,
            report_number=report_number,
            version=1,
            status="ISSUED",
            file_path=file_path,
            sha256_hash=file_hash,
            generated_by=tech.id,
        ))
        db.commit()

    # Ensure all existing reports have valid PDF and SHA-256 hash
    for rep in db.query(Report).all():
        if not rep.sha256_hash or not rep.file_path or not os.path.exists(rep.file_path):
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            rf_path = os.path.join(settings.UPLOAD_DIR, f"{rep.report_number}.pdf")
            c = canvas.Canvas(rf_path, pagesize=letter)
            c.setFont("Helvetica-Bold", 18)
            c.drawString(50, 750, "STANDARDIZED TEST REPORT")
            c.setFont("Helvetica", 11)
            c.drawString(50, 720, "DEMO RULEPACK — NOT AUTHORITATIVE")
            c.drawString(50, 705, "DEMO DATA — FOR DEMONSTRATION ONLY")
            c.drawString(50, 670, f"Report Number: {rep.report_number}")
            c.drawString(50, 650, f"Session: {rep.session.session_number if rep.session else rep.session_id}")
            c.save()
            with open(rf_path, "rb") as f:
                rep.sha256_hash = hashlib.sha256(f.read()).hexdigest()
            rep.file_path = rf_path
            db.commit()

    if db.query(Notification).count() == 0:
        for user in users_by_email.values():
            db.add(Notification(
                user_id=user.id,
                title="Demo case available",
                message="Session TS-1045 is ready for the golden-path demonstration.",
                link=f"/test-sessions/{session.id}",
            ))
            db.add(Notification(
                user_id=user.id,
                title="VisualProof: MISMATCH — REVIEW REQUIRED",
                message="Display capture for TS-1045 requires reviewer confirmation. Advisory only.",
                link=f"/visualproof/{session.id}",
            ))
        db.commit()

    if db.query(AuditLog).count() == 0:
        db.add(AuditLog(
            user_id=tech.id,
            user_email=tech.email,
            user_role=tech.role,
            action="SEED",
            entity_type="TestSession",
            entity_id=str(session.id),
            details={"message": "Demo session seeded", "disclaimer": "DEMO DATA — FOR DEMONSTRATION ONLY"},
        ))
        db.commit()

if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_demo_data(db)
        print("Demo data seeded successfully.")
    finally:
        db.close()

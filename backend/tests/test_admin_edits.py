"""
MetriSure — Automated Tests: Administrator Edits & RBAC Verification
Verifies end-to-end editing capabilities for:
1. User Directory (Users API)
2. Laboratories (Laboratories API)
3. System Settings (Settings API)
Ensures:
- Administrator can edit and changes persist.
- Non-Administrator roles are strictly rejected with 403 Forbidden.
- Unauthenticated requests are rejected with 401 Unauthorized.
- Audit logs are properly recorded for all administrative updates.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.laboratory import Laboratory
from app.models.setting import SystemSetting
from app.models.evidence import AuditLog
from app.core.security import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token():
    return create_access_token({"sub": "admin@metrisure.demo", "role": "ADMINISTRATOR"})


@pytest.fixture
def tech_token():
    return create_access_token({"sub": "technician@metrisure.demo", "role": "TECHNICIAN"})


@pytest.fixture
def reviewer_token():
    return create_access_token({"sub": "reviewer@metrisure.demo", "role": "REVIEWER"})


# ==========================================
# 1. USER MANAGEMENT TESTS
# ==========================================

def test_admin_can_update_user(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "technician@metrisure.demo").first()
        assert user is not None
        user_id = user.id

        # Update full_name and is_active
        payload = {
            "full_name": "Priya Sharma (Senior)",
            "role": "TECHNICIAN",
            "is_active": True,
        }
        res = client.put(f"/api/users/{user_id}", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["full_name"] == "Priya Sharma (Senior)"

        # Verify DB persistence
        db.expire_all()
        db_user = db.query(User).filter(User.id == user_id).first()
        assert db_user.full_name == "Priya Sharma (Senior)"

        # Verify Audit Log
        audit = db.query(AuditLog).filter(
            AuditLog.action == "USER_UPDATED",
            AuditLog.entity_id == str(user_id)
        ).order_by(AuditLog.id.desc()).first()
        assert audit is not None
        assert audit.user_role == "ADMINISTRATOR"

        # Restore original name
        client.put(f"/api/users/{user_id}", json={"full_name": "Priya Sharma"}, headers=headers)
    finally:
        db.close()


def test_non_admin_cannot_update_user(client, tech_token, reviewer_token):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@metrisure.demo").first()
        user_id = user.id

        # Technician attempt -> 403
        res = client.put(
            f"/api/users/{user_id}",
            json={"role": "TECHNICIAN"},
            headers={"Authorization": f"Bearer {tech_token}"},
        )
        assert res.status_code == 403

        # Reviewer attempt -> 403
        res = client.put(
            f"/api/users/{user_id}",
            json={"role": "REVIEWER"},
            headers={"Authorization": f"Bearer {reviewer_token}"},
        )
        assert res.status_code == 403

        # Unauthenticated -> 401 or 403
        res = client.put(f"/api/users/{user_id}", json={"role": "REVIEWER"})
        assert res.status_code in (401, 403)
    finally:
        db.close()


def test_user_update_validations(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "technician@metrisure.demo").first()
        user_id = user.id

        # Invalid role -> 400
        res = client.put(f"/api/users/{user_id}", json={"role": "SUPERUSER"}, headers=headers)
        assert res.status_code == 400

        # Nonexistent user -> 404
        res = client.put("/api/users/999999", json={"role": "REVIEWER"}, headers=headers)
        assert res.status_code == 404
    finally:
        db.close()


# ==========================================
# 2. LABORATORY TESTS
# ==========================================

def test_admin_can_update_laboratory(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    db = SessionLocal()
    try:
        lab = db.query(Laboratory).filter(Laboratory.code == "NML-MUM").first()
        assert lab is not None
        lab_id = lab.id

        payload = {
            "name": "National Metrology Lab Mumbai HQ",
            "contact_email": "nml-hq@metrisure.demo",
            "contact_phone": "+91-22-9999999",
            "is_active": True,
        }
        res = client.put(f"/api/laboratories/{lab_id}", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "National Metrology Lab Mumbai HQ"
        assert data["contact_email"] == "nml-hq@metrisure.demo"

        # Verify DB persistence
        db.expire_all()
        db_lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
        assert db_lab.name == "National Metrology Lab Mumbai HQ"

        # Verify Audit Log
        audit = db.query(AuditLog).filter(
            AuditLog.action == "LABORATORY_UPDATED",
            AuditLog.entity_id == str(lab_id)
        ).order_by(AuditLog.id.desc()).first()
        assert audit is not None
        assert audit.user_role == "ADMINISTRATOR"

        # Revert
        client.put(
            f"/api/laboratories/{lab_id}",
            json={"name": "National Metrology Lab Mumbai", "contact_email": "nml@metrisure.demo"},
            headers=headers,
        )
    finally:
        db.close()


def test_non_admin_cannot_update_laboratory(client, tech_token, reviewer_token):
    db = SessionLocal()
    try:
        lab = db.query(Laboratory).first()
        assert lab is not None

        # Technician attempt -> 403
        res = client.put(
            f"/api/laboratories/{lab.id}",
            json={"name": "Hacked Lab"},
            headers={"Authorization": f"Bearer {tech_token}"},
        )
        assert res.status_code == 403

        # Reviewer attempt -> 403
        res = client.put(
            f"/api/laboratories/{lab.id}",
            json={"name": "Hacked Lab"},
            headers={"Authorization": f"Bearer {reviewer_token}"},
        )
        assert res.status_code == 403

        # Unauthenticated -> 401 or 403
        res = client.put(f"/api/laboratories/{lab.id}", json={"name": "Hacked Lab"})
        assert res.status_code in (401, 403)
    finally:
        db.close()


# ==========================================
# 3. SYSTEM SETTINGS TESTS
# ==========================================

def test_admin_can_update_settings_and_persists(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get current settings
    res = client.get("/api/settings/", headers=headers)
    assert res.status_code == 200
    initial_settings = res.json()
    assert "org_name" in initial_settings

    # Update settings
    update_payload = {
        "org_name": "Indian National Metrology Standards Agency",
        "timezone": "IST (Indian Standard Time)",
        "require_mfa_approvers": False,
        "enforce_password_rotation": True,
        "notification_email": "compliance-alerts@metrisure.demo"
    }
    put_res = client.put("/api/settings/", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["org_name"] == "Indian National Metrology Standards Agency"
    assert updated["timezone"] == "IST (Indian Standard Time)"
    assert updated["require_mfa_approvers"] is False
    assert updated["notification_email"] == "compliance-alerts@metrisure.demo"

    # Verify persistence via fresh GET request
    get_res = client.get("/api/settings/", headers=headers)
    assert get_res.status_code == 200
    fresh = get_res.json()
    assert fresh["org_name"] == "Indian National Metrology Standards Agency"
    assert fresh["timezone"] == "IST (Indian Standard Time)"
    assert fresh["require_mfa_approvers"] is False

    # Verify Audit Log
    db = SessionLocal()
    try:
        audit = db.query(AuditLog).filter(
            AuditLog.action == "SYSTEM_SETTING_UPDATED"
        ).order_by(AuditLog.id.desc()).first()
        assert audit is not None
        assert audit.user_role == "ADMINISTRATOR"
        assert "org_name" in audit.details.get("updated_keys", [])
    finally:
        db.close()

    # Revert back to original
    client.put(
        "/api/settings/",
        json={
            "org_name": "National Metrology Institute",
            "timezone": "UTC (Coordinated Universal Time)",
            "require_mfa_approvers": True,
        },
        headers=headers,
    )


def test_non_admin_cannot_update_settings(client, tech_token, reviewer_token):
    payload = {"org_name": "Unauthorized Change"}

    # Technician attempt -> 403
    res = client.put(
        "/api/settings/",
        json=payload,
        headers={"Authorization": f"Bearer {tech_token}"},
    )
    assert res.status_code == 403

    # Reviewer attempt -> 403
    res = client.put(
        "/api/settings/",
        json=payload,
        headers={"Authorization": f"Bearer {reviewer_token}"},
    )
    assert res.status_code == 403

    # Unauthenticated -> 401 or 403
    res = client.put("/api/settings/", json=payload)
    assert res.status_code in (401, 403)


# ==========================================
# 4. INSTRUMENT REGISTRY TESTS
# ==========================================

def test_instruments_registry_has_three_demo_instruments(client):
    res = client.get("/api/instruments/")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 3
    serials = [i["serial_number"] for i in data["items"]]
    assert "SN-DEMO-001" in serials
    assert "SN-DEMO-002" in serials
    assert "SN-DEMO-003" in serials


def test_instruments_search_and_filters(client):
    # Search by serial
    res_sn2 = client.get("/api/instruments/?q=SN-DEMO-002")
    assert res_sn2.status_code == 200
    assert any(i["serial_number"] == "SN-DEMO-002" for i in res_sn2.json()["items"])

    # Search by model
    res_wm200 = client.get("/api/instruments/?q=WM-200")
    assert res_wm200.status_code == 200
    assert any(i["serial_number"] == "SN-DEMO-003" for i in res_wm200.json()["items"])

    # Filter by accuracy class II
    res_class2 = client.get("/api/instruments/?accuracy_class=II")
    assert res_class2.status_code == 200
    assert any(i["serial_number"] == "SN-DEMO-003" for i in res_class2.json()["items"])

    # Filter by accuracy class III
    res_class3 = client.get("/api/instruments/?accuracy_class=III")
    assert res_class3.status_code == 200
    serials_class3 = [i["serial_number"] for i in res_class3.json()["items"]]
    assert "SN-DEMO-001" in serials_class3
    assert "SN-DEMO-002" in serials_class3


# ==========================================
# 5. AUTH PROFILE & AUDIT EVENTS SCOPING
# ==========================================

def test_auth_me_returns_dynamic_profile_for_all_roles(client, admin_token, tech_token, reviewer_token):
    # Admin
    res_admin = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["email"] == "admin@metrisure.demo"
    assert data_admin["role"] == "ADMINISTRATOR"
    assert data_admin["full_name"] == "Vikram Singh"

    # Technician
    res_tech = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tech_token}"})
    assert res_tech.status_code == 200
    data_tech = res_tech.json()
    assert data_tech["email"] == "technician@metrisure.demo"
    assert data_tech["role"] == "TECHNICIAN"
    assert data_tech["full_name"] == "Priya Sharma"

    # Reviewer
    res_rev = client.get("/api/auth/me", headers={"Authorization": f"Bearer {reviewer_token}"})
    assert res_rev.status_code == 200
    data_rev = res_rev.json()
    assert data_rev["email"] == "reviewer@metrisure.demo"
    assert data_rev["role"] == "REVIEWER"
    assert data_rev["full_name"] == "Rajesh Kumar"


def test_my_audit_events_scoping(client, admin_token, tech_token):
    # Admin can filter by user_email
    res = client.get(
        "/api/audit/?user_email=admin@metrisure.demo",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    for item in res.json()["items"]:
        assert item["user_email"] == "admin@metrisure.demo"

    # Technician automatically scoped to own events
    res_tech = client.get(
        "/api/audit/",
        headers={"Authorization": f"Bearer {tech_token}"}
    )
    assert res_tech.status_code == 200
    for item in res_tech.json()["items"]:
        assert item["user_email"] == "technician@metrisure.demo"

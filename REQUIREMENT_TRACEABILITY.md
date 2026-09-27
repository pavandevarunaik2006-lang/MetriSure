# Requirement Traceability Matrix (SIH26035)

This document maps the specific requirements of the SIH problem statement to the end-to-end features implemented in MetriSure. All core requirements and priority modules are now fully functional and connected to the real FastAPI backend.

| SIH Requirement | Screen / UI Component | Backend Service | Database Model | Verification / Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Digitize evaluation of NAWIs** | `DashboardPage`, `InstrumentsPage`, `LaboratoriesPage` | `app/api/instruments.py`, `app/api/laboratories.py` | `TestSession`, `Instrument`, `Laboratory` | UI & Backend Integration | ✅ FULLY FUNCTIONAL |
| **Apply OIML R-76 rules** | `TestExecutionPage`, `SimulatorPage` | `app/api/test_cases.py`, `app/compliance/engine.py` | `Observation`, `TestCase` | E2E Integration | ✅ FULLY FUNCTIONAL |
| **Calculate Errors vs MPE** | `TestExecutionPage`, `ComplianceResultsPage` | `app/api/observations.py`, `engine.get_mpe` | `Observation.error`, `Calculation` | E2E Integration | ✅ FULLY FUNCTIONAL |
| **Determine PASS/FAIL** | `ComplianceResultsPage`, `DecisionTracePage` | `app/api/compliance.py`, `app/compliance/engine.py` | `TestSession.status`, `Observation.result` | Single Source of Truth | ✅ FULLY FUNCTIONAL |
| **Generate Test Reports** | `ReviewDetailPage`, `VerificationPage` | `app/api/reports.py` | `Report`, `ReportVersion` | Report Generation & Verify | ✅ FULLY FUNCTIONAL |
| **Maintain Integrity** | `AuditTrailPage`, `CaseIntegrityPage` | `app/services/audit.py` | `AuditLog` | Hash Validation | ✅ FULLY FUNCTIONAL |
| **Review & Approval Workflow** | `ReviewDetailPage`, `ReportGuardPage` | `app/api/review.py` | `ApprovalRecord` | Immutable Role Validation | ✅ FULLY FUNCTIONAL |
| **Handle Environmental Data** | `TestSessionDetailPage` (TestReady Gate) | `app/api/test_sessions.py` | `TestSession.temperature` | Data binding | ✅ FULLY FUNCTIONAL |

## High-Value Enhancements (Beyond SIH Scope)
To ensure the solution is robust, modern, and maintains high data quality, the following differentiators were built:
1. **VisualProof**: Securely linking indicator photographs to specific test observations for post-test validation. (UI Advisory, no automatic FAIL).
2. **Data Pattern Analysis**: Applying statistical heuristics to detect repetitive, unusual, or uniform observation patterns and flag for human review ("REVIEW RECOMMENDED").
3. **ReportGuard Pre-Issuance Gate**: Automated gate verifying that all prerequisite data, calculations, and reviewer checks are complete before allowing final Approver sign-off.
4. **What-If Simulator**: A sandbox for testing theoretical inputs against the deterministic Compliance Engine. Explicitly decoupled from official records.
5. **Dynamic Settings & Role-Based Access Control**: Centralized `SettingsPage` and strict backend dependency `require_role()` across all API endpoints.

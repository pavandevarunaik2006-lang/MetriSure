# MetriSure

**A Next-Generation, AI-Ready Compliance Engine for NAWI Type Evaluation (SIH26035)**

MetriSure is a robust, deterministic software platform designed to automate the generation of test reports for Non-Automatic Weighing Instruments (NAWI) strictly in accordance with OIML Recommendation R-76 and the Legal Metrology Act, 2009.

## 🏆 SIH26 Problem Statement Alignment
- **Problem ID:** 26035
- **Problem Title:** Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R-76
- **Core Requirement:** Digitize the evaluation process, calculate Maximum Permissible Errors (MPE), generate deterministic PASS/FAIL rulings, and issue official reports.

## ✨ Key Features & Differentiation

MetriSure goes beyond basic data entry by introducing advanced metrological integrity controls:

1. **Deterministic Compliance Engine**: A Python-based rule engine that dynamically calculates Class I-IIII MPE bounds and executes strict pass/fail logic without human intervention.
2. **VisualProof & OCR Validation**: Photographic evidence of instrument indications is cryptographically linked to test observations to prevent "pencil-whipping" (falsified data).
3. **DecisionTrace**: Transparent, interactive explanations of exactly *Why* an instrument passed or failed.
4. **ReportGuard & TestGuard**: Automated pre-issuance anomaly detection (e.g., Benford's law analysis, metadata tampering checks, impossible execution speeds).
5. **Counterfactual Retest Planner**: Instead of re-running full tests upon a minor failure, the system intelligently targets specific failed quadrants (e.g., Eccentricity) for re-evaluation.
6. **Cryptographic Audit Trail**: Immutable lifecycle tracking from registration to final report issuance.

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend:** FastAPI (Python), SQLAlchemy, SQLite (for portable evaluation)
- **Architecture:** Decoupled RulePack architecture for easy updates to OIML standards.

## 🚀 Getting Started

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

### Backend Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📖 Documentation
Please see the following documents for deep dives into specific areas:
- `DEMO_GUIDE.md` - Step-by-step walkthrough for evaluating the platform.
- `ARCHITECTURE.md` - System architecture and data flow.
- `RULE_ENGINE.md` - Details on how the OIML R-76 compliance engine evaluates observations.
- `REQUIREMENT_TRACEABILITY.md` - Mapping of SIH requirements to implemented features.

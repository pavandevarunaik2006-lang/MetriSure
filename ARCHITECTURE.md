# System Architecture

MetriSure is built on a modern, decoupled client-server architecture designed for high integrity and strict governance.

## High-Level Architecture

```text
[ React Frontend (Vite) ]  <--->  [ RESTful API (FastAPI) ]
       |                                   |
       v                                   v
[ UI Components ]                   [ Routing / Auth ]
[ State Management ]                [ Compliance Engine ]
[ Data Visualizations ]             [ Cryptographic Audit ]
                                           |
                                           v
                                    [ SQLite DB ]
```

## Core Components

### 1. Frontend (React + TypeScript + Tailwind)
- **Pages**: Top-level views mapped to specific workflows (Instruments, Testing, Review).
- **Layouts**: Responsive shells providing navigation and contextual headers.
- **Routing**: `react-router-dom` handles client-side navigation.
- **Mock Data Layer**: For demonstration purposes, the frontend is pre-populated with realistic OIML test data simulating API responses.

### 2. Backend (FastAPI + Python)
- **REST API**: Serves JSON data and receives test observations.
- **Compliance Engine**: The heart of the system. It is strictly separated from the CRUD operations. It receives an array of observations and an instrument profile, determines the applicable MPEs, and returns a deterministic verdict.
- **Audit Service**: Intercepts mutations and logs them to an immutable append-only ledger.

### 3. RulePack System
OIML R-76 rules are not hardcoded into the application logic. Instead, they are defined as `RulePacks` (JSON/Dict configurations).
- **Benefit**: If a new version of the OIML directive is released (or a regional variation like the India LMD Rules is required), the application code does not change. A new RulePack is uploaded, and the engine evaluates data against it.

### 4. Cryptographic Anchoring (Simulated)
To ensure data integrity, key events (Session Submitted, Report Issued) generate SHA-256 hashes of the payload. These hashes are displayed in the Audit Trail and the Provenance Passport.

## Data Flow: Test Execution
1. Operator selects Instrument and initiates a Test Session.
2. Operator inputs environmental data (Temperature, Humidity, Pressure).
3. System loads the specific RulePack for the Instrument's Accuracy Class.
4. Operator enters observations (Load vs Indication).
5. Frontend calls the `/evaluate` endpoint for real-time feedback (MPE bounds).
6. Operator finalizes and submits. Backend permanently locks the observations and calculates the final PASS/FAIL verdict.

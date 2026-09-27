# MetriSure Demo Guide

Welcome to the MetriSure platform! This guide will walk you through an end-to-end demonstration of the software, showcasing how it solves the SIH26035 problem statement.

## Setup Instructions

1. **Start the Frontend**:
   Navigate to the `frontend` directory in your terminal and run:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

*(Note: For this frontend UI demonstration, all data is mocked to ensure a seamless walkthrough without requiring a backend database setup).*

---

## 🎭 Scenario 1: Instrument Registration
**Goal:** Register a new Class III NAWI into the system.

1. In the sidebar, click on **Instruments**.
2. Click the **Register Instrument** button in the top right.
3. Walk through the 6-step premium registration wizard. Notice how it asks for metrological parameters like Max Capacity and Scale Interval ($e$).
4. Complete the wizard.

## 🎭 Scenario 2: Test Session Execution
**Goal:** Run a test session and enter observations.

1. Go to **Testing -> Test Sessions** in the sidebar.
2. Click **New Session** and select an instrument.
3. You will land on the **Test Session Hub**. Notice the `TestReady` gate that requires environmental parameters before testing begins.
4. Click **Execute Tests**.
5. You are now in the `TestExecutionPage`. Notice the live MPE calculation on the right side as you theoretically enter standard loads and indicated values.
6. Click **Finalize Session** at the bottom.

## 🎭 Scenario 3: Compliance & Explainability
**Goal:** See the deterministic ruling of the Compliance Engine.

1. After finalizing the test, you will land on the **Compliance Results** page (`/results`).
2. Notice the large `PASS` or `FAIL` indicator.
3. Click the **DecisionTrace** button.
4. Walk through the logic chain showing exactly *why* the engine arrived at its verdict, including the extracted Rules output at the bottom.
5. Navigate to **Evidence -> VisualProof** in the sidebar to see how photos of the instrument are tied to the data.

## 🎭 Scenario 4: Governance & Reporting
**Goal:** Review the session and generate the official OIML R-76 report.

1. Go to **Governance -> Review & Approval** in the sidebar.
2. Click **Review** on the pending session.
3. Assume the role of an Approver and click **Final Approval (Issue Certificate)**.
4. Go to **Reports -> Report Repository** in the sidebar.
5. Click **View** on a completed report. 
6. You will see a print-ready, official MetriSure Type Evaluation Report.
7. Finally, check **Governance -> Audit Trail** to see the immutable cryptographic logs of all actions performed.

---

### Additional Differentiators to Showcase
- **What-If Simulator** (`/simulations`): Test hypothetical values against the engine.
- **Retest Planner** (`/test-sessions/:id/retest`): See how MetriSure isolates failed quadrants (e.g. Eccentricity) to save time instead of re-running all 64 tests.
- **ReportGuard** (`/reportguard`): See how the system detects anomalous data entry speeds or Benford's Law violations.

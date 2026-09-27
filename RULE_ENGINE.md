# MetriSure Compliance Engine

The core requirement of SIH26035 is the automated, accurate generation of test reports based on OIML R-76. MetriSure handles this via a dedicated deterministic **Compliance Engine**.

## OIML R-76 Maximum Permissible Error (MPE) Calculation

The engine calculates the MPE based on the instrument's Accuracy Class (I, II, III, IIII) and the number of verification scale intervals ($n = Max / e$).

### Class III Example (Medium Accuracy)
For a Class III instrument, the engine applies the following step-function for initial verification:

- **$0 \le m \le 500e$**: MPE = $\pm 0.5e$
- **$500e < m \le 2000e$**: MPE = $\pm 1.0e$
- **$2000e < m \le 10000e$**: MPE = $\pm 1.5e$

*(Where $m$ is the applied load, and $e$ is the verification scale interval).*

For in-service inspections, the engine automatically doubles these values as permitted by the directive.

## Evaluation Pipeline

1. **Context Binding**: The engine receives the Instrument Profile (Class, Max, Min, $e$, $d$) and binds it to the selected RulePack.
2. **Observation Parsing**: Test data (Linearity, Eccentricity, Repeatability) is ingested.
3. **Error Calculation**: For each observation: $Error = Indicated Value - Reference Load$.
4. **Threshold Comparison**: The engine queries the MPE table for the specific load level and compares the absolute Error against the MPE.
5. **Categorical Roll-up**:
   - If *all* observations within a test category (e.g., Eccentricity) pass, the category passes.
   - If *any* observation fails, the category fails.
6. **Final Verdict**: If *all* categories pass, the session achieves a `PASS`.

## DecisionTrace
MetriSure introduces **DecisionTrace**, a feature that outputs the internal logging of the Evaluation Pipeline to the end-user. This provides complete explainability (WhyPASS/WhyFAIL) and eliminates the "black box" nature of automated evaluations.

## Security
The Compliance Engine is intentionally isolated. 
- It cannot be overridden by an Administrator. 
- It does not have database write access (it returns a result object, which the API layer then persists).
- Manual "forcing" of a PASS result is mathematically impossible within the engine's boundaries.

"""
MetriSure — Deterministic Compliance Engine
============================================
CRITICAL MODULE: This is the sole authority for PASS/FAIL decisions.

Rules:
- Same inputs + same RulePack version + same engine version = same result. ALWAYS.
- NO AI, NO LLM, NO UI dependencies, NO SQLAlchemy imports.
- Independently testable as a pure Python module.
- Never invents OIML values — uses RulePack data only.

OIML R-76 Formulas (from research):
- Corrected Indication: P = I + 0.5d - ΔL
- Error: E = P - L  
- Corrected Error: Ec = E - E0
- Pass condition: |Ec| ≤ MPE(L)
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Tuple
import math


# ============================================================
# ENUMS — No external dependencies
# ============================================================

class AccuracyClass(str, Enum):
    CLASS_I = "I"
    CLASS_II = "II"
    CLASS_III = "III"
    CLASS_IIII = "IIII"


class TestType(str, Enum):
    LINEARITY = "LINEARITY"
    REPEATABILITY = "REPEATABILITY"
    ECCENTRICITY = "ECCENTRICITY"
    DISCRIMINATION = "DISCRIMINATION"
    ZERO_SETTING = "ZERO_SETTING"
    TARE = "TARE"
    SENSITIVITY = "SENSITIVITY"
    TILT = "TILT"


class ComplianceResult(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


# ============================================================
# DATA CLASSES — Pure Python, no ORM
# ============================================================

@dataclass
class ErrorCalculation:
    """Result of the error calculation."""
    corrected_indication: float  # P
    raw_error: float             # E
    corrected_error: float       # Ec
    zero_error: float            # E0


@dataclass
class MPEResult:
    """Maximum Permissible Error lookup result."""
    mpe_value: float
    mpe_factor: float  # in units of e (0.5, 1.0, or 1.5)
    load_range_description: str
    is_in_service: bool


@dataclass
class ObservationInput:
    """Input for evaluating a single observation."""
    indicated_value: float
    reference_value: float
    actual_interval_d: float
    verification_interval_e: float
    fractional_weight_delta_l: float = 0.0
    zero_error: float = 0.0
    accuracy_class: str = "III"
    is_in_service: bool = False
    test_type: str = "LINEARITY"
    direction: str = "INCREASING"  # INCREASING or DECREASING
    unit: str = "kg"


@dataclass
class ObservationResult:
    """Output from evaluating a single observation."""
    corrected_indication: float
    raw_error: float
    corrected_error: float
    zero_error: float
    permissible_error: float
    result: str  # PASS or FAIL
    explanation: str
    rule_identifier: str
    engine_version: str
    mpe_factor: float
    load_in_e: float


@dataclass
class RepeatabilityInput:
    """Input for repeatability test evaluation."""
    corrected_indications: List[float]
    reference_value: float
    verification_interval_e: float
    accuracy_class: str = "III"
    is_in_service: bool = False


@dataclass
class RepeatabilityResult:
    """Output from repeatability evaluation."""
    p_max: float
    p_min: float
    range_value: float
    permissible_range: float
    result: str
    explanation: str
    engine_version: str


@dataclass
class EccentricityInput:
    """Input for eccentricity test evaluation."""
    center_corrected_error: float
    position_corrected_errors: List[Tuple[str, float]]  # (position_name, corrected_error)
    reference_value: float
    verification_interval_e: float
    accuracy_class: str = "III"
    is_in_service: bool = False


# ============================================================
# COMPLIANCE ENGINE
# ============================================================

class ComplianceEngine:
    """
    Deterministic Compliance Engine for NAWI type evaluation per OIML R-76.
    
    DEMO RULEPACK — NOT AUTHORITATIVE
    Values based on OIML R-76 research but labeled as demo.
    Replace with verified RulePack data for production use.
    """
    
    VERSION = "1.0.0"
    RULEPACK_LABEL = "DEMO RULEPACK — NOT AUTHORITATIVE"
    
    # --------------------------------------------------------
    # MPE Tables (OIML R-76 Table 6 / LMGR 2011 Table 2)
    # DEMO DATA — FOR DEMONSTRATION ONLY
    # --------------------------------------------------------
    MPE_TABLE = {
        "I": [
            {"max_load_in_e": 50000, "mpe_factor": 0.5},
            {"max_load_in_e": 200000, "mpe_factor": 1.0},
            {"max_load_in_e": float('inf'), "mpe_factor": 1.5},
        ],
        "II": [
            {"max_load_in_e": 5000, "mpe_factor": 0.5},
            {"max_load_in_e": 20000, "mpe_factor": 1.0},
            {"max_load_in_e": 100000, "mpe_factor": 1.5},
        ],
        "III": [
            {"max_load_in_e": 500, "mpe_factor": 0.5},
            {"max_load_in_e": 2000, "mpe_factor": 1.0},
            {"max_load_in_e": 10000, "mpe_factor": 1.5},
        ],
        "IIII": [
            {"max_load_in_e": 50, "mpe_factor": 0.5},
            {"max_load_in_e": 200, "mpe_factor": 1.0},
            {"max_load_in_e": 1000, "mpe_factor": 1.5},
        ],
    }

    def calculate_error(
        self,
        indicated_value: float,
        fractional_weight_delta_l: float,
        actual_interval_d: float,
        test_load: float,
        zero_error: float = 0.0,
    ) -> ErrorCalculation:
        """
        Calculate error using OIML R-76 changeover point method.
        
        P = I + 0.5d - ΔL  (Corrected Indication)
        E = P - L           (Raw Error)
        Ec = E - E0         (Corrected Error, zero-error eliminated)
        """
        # Corrected indication
        corrected_indication = indicated_value + (0.5 * actual_interval_d) - fractional_weight_delta_l
        
        # Raw error
        raw_error = corrected_indication - test_load
        
        # Corrected error (eliminate zero drift)
        corrected_error = raw_error - zero_error
        
        return ErrorCalculation(
            corrected_indication=round(corrected_indication, 6),
            raw_error=round(raw_error, 6),
            corrected_error=round(corrected_error, 6),
            zero_error=round(zero_error, 6),
        )

    def get_mpe(
        self,
        load: float,
        e: float,
        accuracy_class: str,
        is_in_service: bool = False,
    ) -> MPEResult:
        """
        Look up Maximum Permissible Error for a given load.
        
        DEMO RULEPACK — NOT AUTHORITATIVE
        Based on OIML R-76 Table 6 structure.
        
        Returns MPE in the same unit as e.
        """
        if accuracy_class not in self.MPE_TABLE:
            raise ValueError(f"Unknown accuracy class: {accuracy_class}. Expected: I, II, III, IIII")
        
        load_in_e = abs(load) / e if e > 0 else 0
        
        mpe_factor = 1.5  # Default to highest
        range_desc = ""
        
        for bracket in self.MPE_TABLE[accuracy_class]:
            if load_in_e <= bracket["max_load_in_e"]:
                mpe_factor = bracket["mpe_factor"]
                range_desc = f"0 <= m <= {bracket['max_load_in_e']}e"
                break
        
        # In-service: multiply by 2
        multiplier = 2.0 if is_in_service else 1.0
        mpe_value = mpe_factor * multiplier * e
        
        return MPEResult(
            mpe_value=round(mpe_value, 6),
            mpe_factor=mpe_factor,
            load_range_description=range_desc,
            is_in_service=is_in_service,
        )

    def evaluate_observation(self, input: ObservationInput) -> ObservationResult:
        """
        Evaluate a single observation for PASS/FAIL.
        
        This is the DETERMINISTIC decision function.
        Same inputs -> same result. Always.
        
        Decision rule: |Ec| <= MPE(L) -> PASS, otherwise FAIL
        """
        # Step 1: Calculate error
        error_calc = self.calculate_error(
            indicated_value=input.indicated_value,
            fractional_weight_delta_l=input.fractional_weight_delta_l,
            actual_interval_d=input.actual_interval_d,
            test_load=input.reference_value,
            zero_error=input.zero_error,
        )
        
        # Step 2: Look up MPE
        mpe_result = self.get_mpe(
            load=input.reference_value,
            e=input.verification_interval_e,
            accuracy_class=input.accuracy_class,
            is_in_service=input.is_in_service,
        )
        
        # Step 3: Deterministic PASS/FAIL
        load_in_e = abs(input.reference_value) / input.verification_interval_e if input.verification_interval_e > 0 else 0
        abs_corrected_error = abs(error_calc.corrected_error)
        
        if abs_corrected_error <= mpe_result.mpe_value:
            result = ComplianceResult.PASS.value
            explanation = (
                f"PASS: |Ec| = {abs_corrected_error:.4f} {input.unit} "
                f"<= MPE = {mpe_result.mpe_value:.4f} {input.unit} "
                f"(+/-{mpe_result.mpe_factor}e for load range {mpe_result.load_range_description}). "
                f"The calculated error is within the permissible limit."
            )
        else:
            result = ComplianceResult.FAIL.value
            explanation = (
                f"FAIL: |Ec| = {abs_corrected_error:.4f} {input.unit} "
                f"> MPE = {mpe_result.mpe_value:.4f} {input.unit} "
                f"(+/-{mpe_result.mpe_factor}e for load range {mpe_result.load_range_description}). "
                f"The calculated error exceeds the permissible limit."
            )
        
        # Rule identifier
        rule_id = (
            f"OIML-R76-MPE-{input.accuracy_class}-"
            f"{'IN_SERVICE' if input.is_in_service else 'INITIAL'}-"
            f"{mpe_result.mpe_factor}e"
        )
        
        return ObservationResult(
            corrected_indication=error_calc.corrected_indication,
            raw_error=error_calc.raw_error,
            corrected_error=error_calc.corrected_error,
            zero_error=error_calc.zero_error,
            permissible_error=mpe_result.mpe_value,
            result=result,
            explanation=explanation,
            rule_identifier=rule_id,
            engine_version=self.VERSION,
            mpe_factor=mpe_result.mpe_factor,
            load_in_e=round(load_in_e, 2),
        )

    def evaluate_repeatability(self, input: RepeatabilityInput) -> RepeatabilityResult:
        """
        Evaluate repeatability test.
        
        Criterion: Pmax - Pmin ≤ |MPE(L)|
        The range of corrected indications must not exceed the MPE.
        """
        if not input.corrected_indications:
            return RepeatabilityResult(
                p_max=0, p_min=0, range_value=0, permissible_range=0,
                result="FAIL", explanation="No observations provided.",
                engine_version=self.VERSION,
            )
        
        p_max = max(input.corrected_indications)
        p_min = min(input.corrected_indications)
        range_value = p_max - p_min
        
        mpe_result = self.get_mpe(
            load=input.reference_value,
            e=input.verification_interval_e,
            accuracy_class=input.accuracy_class,
            is_in_service=input.is_in_service,
        )
        
        permissible_range = abs(mpe_result.mpe_value)
        
        if range_value <= permissible_range:
            result = ComplianceResult.PASS.value
            explanation = (
                f"PASS: Range = {range_value:.4f} ≤ |MPE| = {permissible_range:.4f}. "
                f"Repeatability is within the permissible limit. "
                f"(Pmax={p_max:.4f}, Pmin={p_min:.4f}, n={len(input.corrected_indications)})"
            )
        else:
            result = ComplianceResult.FAIL.value
            explanation = (
                f"FAIL: Range = {range_value:.4f} > |MPE| = {permissible_range:.4f}. "
                f"Repeatability exceeds the permissible limit. "
                f"(Pmax={p_max:.4f}, Pmin={p_min:.4f}, n={len(input.corrected_indications)})"
            )
        
        return RepeatabilityResult(
            p_max=round(p_max, 6),
            p_min=round(p_min, 6),
            range_value=round(range_value, 6),
            permissible_range=round(permissible_range, 6),
            result=result,
            explanation=explanation,
            engine_version=self.VERSION,
        )

    def evaluate_eccentricity(
        self,
        errors: List[Tuple[str, float]],
        reference_value: float,
        e: float,
        accuracy_class: str,
        is_in_service: bool = False,
    ) -> dict:
        """
        Evaluate eccentricity (shift) test.
        
        Criterion: |Ec| ≤ MPE(L) at every position.
        """
        mpe_result = self.get_mpe(
            load=reference_value, e=e,
            accuracy_class=accuracy_class, is_in_service=is_in_service,
        )
        
        position_results = []
        overall_pass = True
        
        for position_name, corrected_error in errors:
            abs_error = abs(corrected_error)
            passed = abs_error <= mpe_result.mpe_value
            if not passed:
                overall_pass = False
            position_results.append({
                "position": position_name,
                "corrected_error": round(corrected_error, 6),
                "abs_error": round(abs_error, 6),
                "mpe": mpe_result.mpe_value,
                "result": "PASS" if passed else "FAIL",
            })
        
        return {
            "overall_result": "PASS" if overall_pass else "FAIL",
            "positions": position_results,
            "mpe": mpe_result.mpe_value,
            "engine_version": self.VERSION,
        }

    def evaluate_discrimination(
        self,
        indicated_before: float,
        indicated_after: float,
        actual_interval_d: float,
    ) -> dict:
        """
        Evaluate discrimination test.
        
        After adding 1.4d, the display must change by at least 1d.
        """
        change = abs(indicated_after - indicated_before)
        passed = change >= actual_interval_d
        
        return {
            "indicated_before": indicated_before,
            "indicated_after": indicated_after,
            "change": round(change, 6),
            "required_change": actual_interval_d,
            "result": "PASS" if passed else "FAIL",
            "explanation": (
                f"{'PASS' if passed else 'FAIL'}: Display change = {change:.4f}, "
                f"required ≥ {actual_interval_d:.4f} (1d). "
                f"After adding 1.4d extra load, the display "
                f"{'changed adequately' if passed else 'did not change adequately'}."
            ),
            "engine_version": self.VERSION,
        }


# Singleton instance
engine = ComplianceEngine()

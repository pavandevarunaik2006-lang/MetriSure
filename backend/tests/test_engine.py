import sys
import os
import unittest

# Add parent dir to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.compliance.engine import (
    engine, 
    ObservationInput, 
    RepeatabilityInput, 
    ComplianceResult
)

class TestComplianceEngine(unittest.TestCase):
    
    def test_calculate_error(self):
        # P = 10.0 + 0.5*(0.01) - 0.002 = 10.003
        # E = 10.003 - 10.0 = 0.003
        # Ec = 0.003 - 0.001 = 0.002
        calc = engine.calculate_error(
            indicated_value=10.0,
            actual_interval_d=0.01,
            fractional_weight_delta_l=0.002,
            test_load=10.0,
            zero_error=0.001
        )
        self.assertAlmostEqual(calc.corrected_indication, 10.003)
        self.assertAlmostEqual(calc.raw_error, 0.003)
        self.assertAlmostEqual(calc.corrected_error, 0.002)

    def test_get_mpe_class_iii(self):
        # Class III, e=0.005 kg, load=15kg (3000e)
        # 3000e falls into 2000e-10000e bracket (factor=1.5)
        # mpe = 1.5 * 0.005 = 0.0075
        res = engine.get_mpe(load=15.0, e=0.005, accuracy_class="III")
        self.assertEqual(res.mpe_factor, 1.5)
        self.assertAlmostEqual(res.mpe_value, 0.0075)

    def test_evaluate_observation_pass(self):
        obs = ObservationInput(
            indicated_value=15.001,
            reference_value=15.0,
            actual_interval_d=0.005,
            verification_interval_e=0.005,
            accuracy_class="III"
        )
        # P = 15.001 + 0.0025 - 0 = 15.0035
        # E = 15.0035 - 15.0 = 0.0035
        # MPE for 15kg (3000e) = 0.0075. |0.0035| <= 0.0075 -> PASS
        res = engine.evaluate_observation(obs)
        self.assertEqual(res.result, ComplianceResult.PASS.value)

    def test_evaluate_observation_fail(self):
        obs = ObservationInput(
            indicated_value=15.008,
            reference_value=15.0,
            actual_interval_d=0.005,
            verification_interval_e=0.005,
            accuracy_class="III"
        )
        # P = 15.008 + 0.0025 - 0 = 15.0105
        # E = 15.0105 - 15.0 = 0.0105
        # MPE for 15kg = 0.0075. |0.0105| > 0.0075 -> FAIL
        res = engine.evaluate_observation(obs)
        self.assertEqual(res.result, ComplianceResult.FAIL.value)

    def test_evaluate_repeatability_pass(self):
        # MPE for 10kg (2000e) is 1.0e = 0.005
        # Range of indications must be <= 0.005
        rep_in = RepeatabilityInput(
            corrected_indications=[10.001, 10.002, 10.004, 10.002, 10.001],
            reference_value=10.0,
            verification_interval_e=0.005,
            accuracy_class="III"
        )
        res = engine.evaluate_repeatability(rep_in)
        self.assertEqual(res.result, ComplianceResult.PASS.value)
        self.assertAlmostEqual(res.range_value, 0.003)

    def test_evaluate_repeatability_fail(self):
        rep_in = RepeatabilityInput(
            corrected_indications=[10.001, 10.002, 10.008, 10.002, 10.001],
            reference_value=10.0,
            verification_interval_e=0.005,
            accuracy_class="III"
        )
        res = engine.evaluate_repeatability(rep_in)
        self.assertEqual(res.result, ComplianceResult.FAIL.value)
        self.assertAlmostEqual(res.range_value, 0.007)

    def test_evaluate_eccentricity_pass(self):
        # MPE for 5kg (1000e) is 1.0e = 0.005
        errors = [
            ("Center", 0.001),
            ("Front Left", -0.002),
            ("Front Right", 0.004),
            ("Rear Left", -0.003),
            ("Rear Right", 0.000)
        ]
        res = engine.evaluate_eccentricity(
            errors=errors,
            reference_value=5.0,
            e=0.005,
            accuracy_class="III"
        )
        self.assertEqual(res["overall_result"], "PASS")

    def test_evaluate_eccentricity_fail(self):
        errors = [
            ("Center", 0.001),
            ("Front Left", -0.002),
            ("Front Right", 0.008), # Exceeds 0.005
            ("Rear Left", -0.003),
            ("Rear Right", 0.000)
        ]
        res = engine.evaluate_eccentricity(
            errors=errors,
            reference_value=5.0,
            e=0.005,
            accuracy_class="III"
        )
        self.assertEqual(res["overall_result"], "FAIL")

if __name__ == '__main__':
    unittest.main()

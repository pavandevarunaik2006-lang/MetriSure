from app.models.test_case import TestCase

def generate_test_plan(db, session_id):
    # Simplified generator
    cases = []
    tests = [
        {"type": "LINEARITY", "name": "Linearity Test"},
        {"type": "REPEATABILITY", "name": "Repeatability Test"},
        {"type": "ECCENTRICITY", "name": "Eccentricity Test"},
        {"type": "DISCRIMINATION", "name": "Discrimination Test"},
        {"type": "ZERO_SETTING", "name": "Zero-setting Test"}
    ]
    for idx, test in enumerate(tests):
        tc = TestCase(
            session_id=session_id,
            test_type=test["type"],
            test_name=test["name"],
            sequence_number=idx + 1,
            status="PENDING",
            notes="Auto-generated"
        )
        db.add(tc)
        cases.append(tc)
    db.commit()
    return cases

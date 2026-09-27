DEMO_RULEPACK_CLASS_III = {
    "rulePackId": "DEMO-OIML-R76-CLASS-III-v1.0",
    "standard": "OIML R-76-1:2006",
    "standardVersion": "2006",
    "packVersion": "1.0.0",
    "accuracyClass": "III",
    "name": "DEMO RULEPACK - Class III Medium Accuracy NAWI",
    "description": "DEMO RULEPACK — NOT AUTHORITATIVE. Based on OIML R-76 structure for demonstration.",
    "isDemo": True,
    "clauses": [
        {
            "clause": "3.5.1",
            "title": "Maximum Permissible Errors (MPE)",
            "requirement": "Errors of indication shall not exceed the maximum permissible error for initial verification.",
            "tolerances": [
                {"range": "0 <= m <= 500e", "mpe": "+/- 0.5 e"},
                {"range": "500e < m <= 2000e", "mpe": "+/- 1.0 e"},
                {"range": "2000e < m <= 10000e", "mpe": "+/- 1.5 e"}
            ]
        },
        {
            "clause": "A.4.4",
            "title": "Eccentricity Test",
            "requirement": "The errors of indication at different positions of a load (1/3 Max + Tare) on the load receptor shall not exceed the MPE.",
            "tolerances": [{"parameter": "Load ratio", "value": "1/3 Max (or 1/4 for 4-point support)"}]
        },
        {
            "clause": "A.4.10",
            "title": "Repeatability Test",
            "requirement": "Difference between maximum and minimum indicated values from identical load applications shall not exceed the absolute value of MPE.",
            "tolerances": [{"parameter": "Series count", "value": "3 series of 3 weighings at 0.5 Max and 1.0 Max"}]
        },
        {
            "clause": "A.4.6",
            "title": "Tare Mechanism Accuracy",
            "requirement": "With any tare applied, the weighing performance shall remain compliant with MPE tolerances.",
            "tolerances": [{"parameter": "Tare effect", "value": "Net indication error <= MPE(Net)"}]
        },
        {
            "clause": "3.9.2.2",
            "title": "Zero-Setting and Zero-Tracking Limits",
            "requirement": "The zero indication after zero-setting shall be within +/- 0.25 e.",
            "tolerances": [{"parameter": "Zero error threshold", "value": "+/- 0.25 e"}]
        }
    ],
    "parameters": {
        "accuracy_class": "III",
        "verification_scale_intervals": "500 to 10000",
        "mpe_tiers": [
            {"tier": 1, "min_e": 0, "max_e": 500, "mpe_initial_e": 0.5, "mpe_service_e": 1.0},
            {"tier": 2, "min_e": 501, "max_e": 2000, "mpe_initial_e": 1.0, "mpe_service_e": 2.0},
            {"tier": 3, "min_e": 2001, "max_e": 10000, "mpe_initial_e": 1.5, "mpe_service_e": 3.0}
        ],
        "test_rules": [
            {"id": "RULE-R76-01", "name": "Initial Verification MPE Check", "clause": "3.5.1"},
            {"id": "RULE-R76-02", "name": "Eccentricity Position Check", "clause": "A.4.4"},
            {"id": "RULE-R76-03", "name": "Repeatability Dispersion Check", "clause": "A.4.10"},
            {"id": "RULE-R76-04", "name": "Tare Mechanism Check", "clause": "A.4.6"},
            {"id": "RULE-R76-05", "name": "Zero-Setting Tolerance Check", "clause": "3.9.2.2"}
        ],
        "environmental_envelope": {
            "temperature_min_c": 10.0,
            "temperature_max_c": 30.0,
            "humidity_max_percent": 85.0
        }
    }
}


/**
 * MetriSure — Mock Data
 * DEMO DATA — FOR DEMONSTRATION ONLY
 * All values are synthetic and clearly labeled.
 */

// ============================================================
// INSTRUMENTS (flat format for table display)
// ============================================================
export const mockInstruments = [
  {
    id: 1,
    serial_number: 'WS-2026-001',
    manufacturer: 'Sartorius AG',
    model_name: 'Cubis II MCA',
    accuracy_class: 'I',
    max_capacity: 220,
    unit: 'g',
    status: 'APPROVED',
    laboratory: 'National Metrology Lab, Mumbai',
  },
  {
    id: 2,
    serial_number: 'WS-2026-002',
    manufacturer: 'Mettler Toledo',
    model_name: 'XPR205',
    accuracy_class: 'II',
    max_capacity: 520,
    unit: 'g',
    status: 'TESTING',
    laboratory: 'National Metrology Lab, Mumbai',
  },
  {
    id: 3,
    serial_number: 'WS-2026-003',
    manufacturer: 'Essae Teraoka',
    model_name: 'DS-852',
    accuracy_class: 'III',
    max_capacity: 30,
    unit: 'kg',
    status: 'ACTIVE',
    laboratory: 'Regional Testing Lab, Delhi',
  },
  {
    id: 4,
    serial_number: 'WS-2026-004',
    manufacturer: 'Avery Weigh-Tronix',
    model_name: 'ZM303',
    accuracy_class: 'III',
    max_capacity: 3000,
    unit: 'kg',
    status: 'TESTING',
    laboratory: 'State Metrology Lab, Bangalore',
  },
  {
    id: 5,
    serial_number: 'WS-2026-005',
    manufacturer: 'Essae Teraoka',
    model_name: 'SI-810',
    accuracy_class: 'III',
    max_capacity: 50,
    unit: 'kg',
    status: 'REGISTERED',
    laboratory: 'Regional Testing Lab, Delhi',
  },
  {
    id: 6,
    serial_number: 'WS-2026-006',
    manufacturer: 'Goldbell Industries',
    model_name: 'GB-500P',
    accuracy_class: 'III',
    max_capacity: 500,
    unit: 'kg',
    status: 'ACTIVE',
    laboratory: 'State Metrology Lab, Bangalore',
  },
  {
    id: 7,
    serial_number: 'WB-2026-001',
    manufacturer: 'Digi Scale',
    model_name: 'WB-120T',
    accuracy_class: 'IIII',
    max_capacity: 120,
    unit: 't',
    status: 'REGISTERED',
    laboratory: 'National Metrology Lab, Mumbai',
  },
];

export const mockInstrumentModels = [
  { id: 1, name: 'Cubis II MCA', accuracy_class: 'I', manufacturer: 'Sartorius AG' },
  { id: 2, name: 'XPR205', accuracy_class: 'II', manufacturer: 'Mettler Toledo' },
  { id: 3, name: 'DS-852', accuracy_class: 'III', manufacturer: 'Essae Teraoka' },
  { id: 4, name: 'ZM303', accuracy_class: 'III', manufacturer: 'Avery Weigh-Tronix' },
  { id: 5, name: 'SI-810', accuracy_class: 'III', manufacturer: 'Essae Teraoka' },
];

// ============================================================
// TEST SESSIONS (flat format for table display)
// ============================================================
export const mockTestSessions = [
  {
    id: 1,
    session_number: 'TS-2026-001',
    instrument_name: 'DS-852 (Essae Teraoka)',
    serial_number: 'WS-2026-003',
    status: 'COMPLETED',
    result: 'PASS' as const,
    isPass: true,
    passed_tests: 64,
    failed_tests: 0,
    max_error: 0.0012,
    permissible_error: 0.0015,
    trace_text: 'All 64 observations strictly adhered to the maximum permissible errors (MPE) defined in OIML R-76 for Class III instruments. No environmental limits were breached, and all required tests were completed.',
    operator: 'Priya Sharma',
    date: '2026-09-18',
    progress: 100,
    laboratory: 'Regional Testing Lab, Delhi',
    rulepack: 'DEMO-OIML-R76-v1.0',
  },
  {
    id: 2,
    session_number: 'TS-2026-002',
    instrument_name: 'ZM303 (Avery Weigh-Tronix)',
    serial_number: 'WS-2026-004',
    status: 'SUBMITTED',
    result: 'FAIL' as const,
    isPass: false,
    passed_tests: 63,
    failed_tests: 1,
    max_error: 0.0018,
    permissible_error: 0.0010,
    trace_text: 'The Eccentricity Test recorded an error of 0.0018 kg, which exceeds the applicable MPE of 0.0010 kg for a Class III instrument at 30% of Max capacity. All other tests passed.',
    operator: 'Priya Sharma',
    date: '2026-09-22',
    progress: 100,
    laboratory: 'State Metrology Lab, Bangalore',
    rulepack: 'DEMO-OIML-R76-v1.0',
  },
  {
    id: 3,
    session_number: 'TS-2026-003',
    instrument_name: 'SI-810 (Essae Teraoka)',
    serial_number: 'WS-2026-005',
    status: 'IN_PROGRESS',
    result: null,
    isPass: null,
    passed_tests: 28,
    failed_tests: 0,
    max_error: null,
    permissible_error: null,
    trace_text: null,
    operator: 'Priya Sharma',
    date: '2026-09-25',
    progress: 45,
    laboratory: 'Regional Testing Lab, Delhi',
    rulepack: 'DEMO-OIML-R76-v1.0',
  },
  {
    id: 4,
    session_number: 'TS-2026-004',
    instrument_name: 'XPR205 (Mettler Toledo)',
    serial_number: 'WS-2026-002',
    status: 'REVIEWER_APPROVED',
    result: 'PASS' as const,
    isPass: true,
    passed_tests: 48,
    failed_tests: 0,
    max_error: 0.0001,
    permissible_error: 0.0005,
    trace_text: 'All 48 observations strictly adhered to the MPE bounds for Class II instruments.',
    operator: 'Priya Sharma',
    date: '2026-09-23',
    progress: 100,
    laboratory: 'National Metrology Lab, Mumbai',
    rulepack: 'DEMO-OIML-R76-v1.0',
  },
  {
    id: 5,
    session_number: 'TS-2026-005',
    instrument_name: 'GB-500P (Goldbell Industries)',
    serial_number: 'WS-2026-006',
    status: 'DRAFT',
    result: null,
    isPass: null,
    passed_tests: 0,
    failed_tests: 0,
    max_error: null,
    permissible_error: null,
    trace_text: null,
    operator: 'Priya Sharma',
    date: '2026-09-25',
    progress: 0,
    laboratory: 'State Metrology Lab, Bangalore',
    rulepack: 'DEMO-OIML-R76-v1.0',
  },
];

// ============================================================
// DASHBOARD DATA
// ============================================================
export const mockDashboardMetrics = {
  active_sessions: 3,
  pending_review: 2,
  approved_reports: 8,
  retest_required: 1,
};

export const mockActivityData = [
  { day: 'Mon', tests: 4 },
  { day: 'Tue', tests: 7 },
  { day: 'Wed', tests: 5 },
  { day: 'Thu', tests: 9 },
  { day: 'Fri', tests: 6 },
  { day: 'Sat', tests: 3 },
  { day: 'Sun', tests: 2 },
];

export const mockPassFailData = [
  { name: 'PASS', value: 24, fill: '#10b981' },
  { name: 'FAIL', value: 6, fill: '#f43f5e' },
  { name: 'Pending', value: 4, fill: '#f59e0b' },
];

export const mockRecentReports = [
  { id: 'RPT-2026-001', instrument: 'DS-852', serial: 'WS-2026-003', date: '2026-09-19', status: 'APPROVED' },
  { id: 'RPT-2026-002', instrument: 'ZM303', serial: 'WS-2026-004', date: '2026-09-23', status: 'UNDER_REVIEW' },
  { id: 'RPT-2026-003', instrument: 'Cubis II', serial: 'WS-2026-001', date: '2026-09-15', status: 'APPROVED' },
];

export const mockReviewQueue = [
  { id: 1, session: 'TS-2026-002', instrument: 'ZM303', submitted: '2026-09-22', priority: 'HIGH' },
  { id: 2, session: 'TS-2026-004', instrument: 'XPR205', submitted: '2026-09-23', priority: 'MEDIUM' },
];

export const mockDataQualitySignals = [
  { id: 1, severity: 'WARNING', message: 'Three consecutive identical observations in TS-2026-003. REVIEW RECOMMENDED.', test: 'Linearity' },
  { id: 2, severity: 'INFO', message: 'Missing evidence for 2 critical observations in TS-2026-002', test: 'Eccentricity' },
  { id: 3, severity: 'SUCCESS', message: 'All VisualProof checks passed for TS-2026-001', test: 'All' },
];

// ============================================================
// DEMO OBSERVATIONS (Class III, e=1g, Max=30kg)
// DEMO DATA — FOR DEMONSTRATION ONLY
// ============================================================
export const mockObservations = [
  { id: 1, point: '20 g (Min)', reference: 0.020, indicated: 0.020, error: 0.0000, mpe: 0.0005, result: 'PASS' },
  { id: 2, point: '500 g', reference: 0.500, indicated: 0.500, error: 0.0002, mpe: 0.0005, result: 'PASS' },
  { id: 3, point: '1000 g', reference: 1.000, indicated: 1.001, error: 0.0008, mpe: 0.0010, result: 'PASS' },
  { id: 4, point: '2000 g', reference: 2.000, indicated: 2.002, error: 0.0018, mpe: 0.0010, result: 'FAIL' },
  { id: 5, point: '5000 g', reference: 5.000, indicated: 5.001, error: 0.0012, mpe: 0.0015, result: 'PASS' },
  { id: 6, point: '10000 g (Max)', reference: 10.000, indicated: 10.002, error: 0.0014, mpe: 0.0015, result: 'PASS' },
];

export const mockLaboratories = [
  { id: 1, name: 'National Metrology Lab, Mumbai', code: 'NML-MUM' },
  { id: 2, name: 'Regional Testing Lab, Delhi', code: 'RTL-DEL' },
  { id: 3, name: 'State Metrology Lab, Bangalore', code: 'SML-BLR' },
];

export type UserRole = 'TECHNICIAN' | 'REVIEWER' | 'APPROVER' | 'ADMINISTRATOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export type TestSessionStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'RETEST_REQUIRED' | 'APPROVED' | 'COMPLETED';

export type TestType = 'LINEARITY' | 'REPEATABILITY' | 'ECCENTRICITY' | 'DISCRIMINATION' | 'ZERO_SETTING' | 'TARE' | 'SENSITIVITY' | 'TILT';

export type ComplianceResultType = 'PASS' | 'FAIL' | 'PENDING';

export type ReportStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'AMENDED';

export type EvidenceVerificationStatus = 'PENDING' | 'MATCH' | 'MISMATCH' | 'OCR_UNCERTAIN' | 'VERIFIED' | 'MISSING';

export interface InstrumentModel {
  id: number;
  name: string;
  accuracy_class: string;
}

export interface Instrument {
  id: number;
  model: InstrumentModel;
  serial_number: string;
  status: string;
}

export interface Laboratory {
  id: number;
  name: string;
}

export interface EnvironmentalConditions {
  temperature: number;
  humidity: number;
  pressure: number;
}

export interface Observation {
  id: number;
  load: number;
  indication: number;
  error: number;
  mpe: number;
  result: ComplianceResultType;
}

export interface TestCase {
  id: number;
  type: TestType;
  observations: Observation[];
  result: ComplianceResultType;
}

export interface TestSession {
  id: number;
  instrument: Instrument;
  status: TestSessionStatus;
  operator: User;
  date: string;
  progress: number;
  test_cases?: TestCase[];
}

export interface Calculation {
  id: number;
}

export interface Evidence {
  id: number;
  status: EvidenceVerificationStatus;
}

export interface RulePack {
  id: number;
  name: string;
}

export interface ReportVersion {
  id: number;
  version: number;
}

export interface Report {
  id: string;
  instrument: Instrument;
  date: string;
  status: ReportStatus;
}

export interface ApprovalRecord {
  id: number;
}

export interface AuditLog {
  id: number;
}

export interface Simulation {
  id: number;
}

export interface DashboardMetrics {
  active_sessions: number;
  pending_review: number;
  approved_reports: number;
  retest_required: number;
}

export interface DemoScenario {
  id: number;
}

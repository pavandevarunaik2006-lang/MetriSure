import {
  
  
  
  Routes,
  Route,
  Navigate } from 'react-router-dom';
import {
  useAuth } from '../hooks/useAuth';
import {
  AppLayout } from '../components/layouts/AppLayout';
import {
  LoginPage } from '../pages/LoginPage';
import {
  DashboardPage } from '../pages/DashboardPage';
import {
  SessionSelectorPage,
  TestReadyPage,
  TestPlanPage,
  ResultsPage,
  WhyPassPage,
  WhyFailPage,
  VisualProofPage,
  TestGuardPage,
  ProvenancePage,
  ReportGuardPage,
  ApprovalDiffPage,
  RulePackPage,
  ChangeImpactPage,
  InstrumentsPage,
  InstrumentDetailPage,
  InstrumentRegistrationPage,
  TestSessionsPage,
  TestSessionNewPage,
  TestSessionDetailPage,
  TestExecutionPage,
  ComplianceResultsPage,
  ReviewWorkspacePage,
  ReviewDetailPage,
  ReportRepositoryPage,
  ReportsPage,
  ReportDetailPage,
  AuditTrailPage,
  VerificationPage,
  HistoryPage,
  UsersPage,
  SettingsPage,
  LaboratoriesPage,
  DecisionTracePage,
  CaseIntegrityPage,
  SimulatorPage,
  RetestPlannerPage,
  ReplayCapsulePage,
  RulePacksPage,
  Legacy2CasePage,
  PlaceholderPage,
  NotificationsPage
} from '../pages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading MetriSure...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verification/:id" element={<VerificationPage />} />

      {/* Protected routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Overview */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Context-Dependent Dynamic Routes */}
        <Route path="/test-ready" element={<SessionSelectorPage />} />
        <Route path="/test-ready/:id" element={<TestReadyPage />} />
        
        <Route path="/test-plan" element={<SessionSelectorPage />} />
        <Route path="/test-plan/:id" element={<TestPlanPage />} />
        
        <Route path="/test-execution" element={<SessionSelectorPage />} />
        <Route path="/test-execution/:id" element={<TestExecutionPage />} />
        
        <Route path="/results" element={<SessionSelectorPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        
        <Route path="/why-pass" element={<SessionSelectorPage />} />
        <Route path="/why-pass/:id" element={<WhyPassPage />} />
        
        <Route path="/why-fail" element={<SessionSelectorPage />} />
        <Route path="/why-fail/:id" element={<WhyFailPage />} />

        <Route path="/decision-trace" element={<SessionSelectorPage />} />
        <Route path="/decision-trace/:id" element={<DecisionTracePage />} />
        
        <Route path="/visualproof" element={<SessionSelectorPage />} />
        <Route path="/visualproof/:id" element={<VisualProofPage />} />
        
        <Route path="/provenance" element={<SessionSelectorPage />} />
        <Route path="/provenance/:id" element={<ProvenancePage />} />
        
        <Route path="/testguard" element={<SessionSelectorPage />} />
        <Route path="/testguard/:id" element={<TestGuardPage />} />
        
        <Route path="/reportguard" element={<SessionSelectorPage />} />
        <Route path="/reportguard/:id" element={<ReportGuardPage />} />
        
        <Route path="/approval-diff" element={<SessionSelectorPage />} />
        <Route path="/approval-diff/:id" element={<ApprovalDiffPage />} />
        
        <Route path="/change-impact" element={<ChangeImpactPage />} />
        <Route path="/change-impact/:id" element={<ChangeImpactPage />} />
        
        <Route path="/rulepacks" element={<RulePacksPage />} />
        <Route path="/rulepacks/:id" element={<RulePackPage />} />

        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Testing */}
        <Route path="/instruments" element={<InstrumentsPage />} />
        <Route path="/instruments/new" element={<InstrumentRegistrationPage />} />
        <Route path="/instruments/:id" element={<InstrumentDetailPage />} />
        <Route path="/test-sessions" element={<TestSessionsPage />} />
        <Route path="/test-sessions/new" element={<TestSessionNewPage />} />
        <Route path="/test-sessions/:id" element={<TestSessionDetailPage />} />
        <Route path="/test-sessions/:id/tests" element={<TestExecutionPage />} />
        <Route path="/test-sessions/:id/results" element={<ComplianceResultsPage />} />
        <Route path="/test-sessions/:id/decision-trace" element={<DecisionTracePage />} />
        <Route path="/test-sessions/:id/provenance" element={<ProvenancePage />} />
        <Route path="/test-sessions/:id/case-integrity" element={<CaseIntegrityPage />} />
        <Route path="/test-sessions/:id/retest" element={<RetestPlannerPage />} />

        {/* Compliance */}
        <Route path="/why-pass-fail" element={<Navigate to="/why-pass" replace />} />
        <Route path="/simulations" element={<SimulatorPage />} />

        {/* Evidence */}
        <Route path="/case-integrity" element={<CaseIntegrityPage />} />

        {/* Reports */}
        <Route path="/repository" element={<ReportRepositoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/history" element={<HistoryPage />} />

        {/* Governance */}
        <Route path="/review" element={<ReviewWorkspacePage />} />
        <Route path="/review/:id" element={<ReviewDetailPage />} />
        <Route path="/approval" element={<ReviewWorkspacePage />} />
        <Route path="/approval/:id" element={<ReviewDetailPage />} />
        <Route path="/audit" element={<AuditTrailPage />} />
        <Route path="/replay" element={<ReplayCapsulePage />} />

        {/* Rules */}
        <Route path="/rules" element={<RulePacksPage />} />
        <Route path="/rules/change-impact" element={<Legacy2CasePage />} />

        {/* Administration */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/laboratories" element={<LaboratoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

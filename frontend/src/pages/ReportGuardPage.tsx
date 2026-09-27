import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft,
  RefreshCw, ExternalLink, FileCheck, Award, Lock, ArrowRight,
  Database, Camera, ClipboardCheck, FileText, Check, X
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

interface QualityCheck {
  name: string;
  category?: 'DATA' | 'EVIDENCE' | 'REVIEW' | 'APPROVAL' | 'REPORT';
  status: 'PASS' | 'REVIEW' | 'BLOCKED';
  explanation: string;
  affected_entity: string;
  action_link?: string;
}

export function ReportGuardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [reportGuardData, setReportGuardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sessRes, rgRes] = await Promise.all([
        apiClient.get(`/test-sessions/${id}`),
        apiClient.get(`/review/${id}/reportguard`),
      ]);
      setSession(sessRes.data);
      setReportGuardData(rgRes.data);
    } catch (err: any) {
      console.error('Failed to load ReportGuard data:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to load report readiness analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Scanning ReportGuard quality gates & audit prerequisites...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-rose-600 font-semibold mb-4">{errorMsg || `Test session #${id} not found.`}</p>
          <button
            onClick={() => navigate('/test-sessions')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Test Sessions
          </button>
        </div>
      </div>
    );
  }

  const overallStatus = reportGuardData?.status || 'READY FOR REVIEW';
  const rawChecks: QualityCheck[] = reportGuardData?.checks || [];

  // Group checks into DATA, EVIDENCE, REVIEW, APPROVAL, REPORT
  const categorizeCheck = (chk: QualityCheck): 'DATA' | 'EVIDENCE' | 'REVIEW' | 'APPROVAL' | 'REPORT' => {
    const text = (chk.name + ' ' + chk.explanation + ' ' + chk.affected_entity).toLowerCase();
    if (text.includes('evidence') || text.includes('ocr') || text.includes('photo') || text.includes('display')) return 'EVIDENCE';
    if (text.includes('review') || text.includes('reviewer')) return 'REVIEW';
    if (text.includes('approv') || text.includes('sign-off')) return 'APPROVAL';
    if (text.includes('report') || text.includes('issuance') || text.includes('pdf')) return 'REPORT';
    return 'DATA';
  };

  const groups: Record<string, { label: string; icon: any; items: QualityCheck[] }> = {
    DATA: { label: 'Data & Metrological Integrity', icon: Database, items: [] },
    EVIDENCE: { label: 'Physical Evidence & VisualProof', icon: Camera, items: [] },
    REVIEW: { label: 'Peer Review & Verification', icon: ClipboardCheck, items: [] },
    APPROVAL: { label: 'Final Approver Authority', icon: Shield, items: [] },
    REPORT: { label: 'Standardized Report Readiness', icon: FileText, items: [] },
  };

  rawChecks.forEach(chk => {
    const cat = categorizeCheck(chk);
    groups[cat].items.push(chk);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate(`/review/${session.id}`)}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Review Workspace
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-600" />
              ReportGuard Readiness Inspection
            </h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Session {session.session_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Systematic quality gating auditing administrative completeness, environmental stability, and optical evidence integrity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Re-scan quality checks"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to={`/review/${session.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            Open Review & Approval Gate <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={session.id}
        sessionNumber={session.session_number}
        currentStep="REVIEW"
      />

      {/* Protocol Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3 text-xs text-indigo-900 leading-relaxed">
        <FileCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong>ReportGuard Pre-Issuance Quality Gate:</strong> Audits relational completeness, environmental controls, and optical evidence before standardized test report generation. <em>ReportGuard findings are strictly advisory and do not mutate official deterministic compliance calculations</em>.
        </div>
      </div>

      {/* Status Summary Banner */}
      <div className={`rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        overallStatus === 'READY FOR REPORT ISSUANCE'
          ? 'bg-emerald-50 border-emerald-300'
          : overallStatus === 'BLOCKED'
          ? 'bg-rose-50 border-rose-300'
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-4">
          {overallStatus === 'READY FOR REPORT ISSUANCE' ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-600 shrink-0 mt-0.5" />
          ) : overallStatus === 'BLOCKED' ? (
            <ShieldAlert className="h-10 w-10 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-10 w-10 text-amber-600 shrink-0 mt-0.5" />
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Readiness Status: {overallStatus}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
              {overallStatus === 'READY FOR REPORT ISSUANCE'
                ? 'All mandatory metrological quality checks and prerequisites passed. Official Standardized Test Report is ready for generation.'
                : overallStatus === 'BLOCKED'
                ? 'One or more blocking quality checks require correction before a report can be generated.'
                : 'Session is technically compliant but requires formal peer review confirmation or supervisor approval.'}
            </p>
          </div>
        </div>

        <Link
          to={`/review/${session.id}`}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
        >
          Review Decision Workspace
        </Link>
      </div>

      {/* Grouped Quality Checks (DATA, EVIDENCE, REVIEW, APPROVAL, REPORT) */}
      <div className="space-y-4">
        {Object.entries(groups).map(([catKey, grp]) => {
          if (grp.items.length === 0) return null;
          const GroupIcon = grp.icon;

          return (
            <div key={catKey} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {grp.label} ({catKey})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {grp.items.filter(i => i.status === 'PASS').length}/{grp.items.length} Satisfied
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {grp.items.map((chk, idx) => {
                  const isPass = chk.status === 'PASS';
                  const isBlocked = chk.status === 'BLOCKED';

                  return (
                    <div key={idx} className="p-4 px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{chk.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            • Entity: {chk.affected_entity}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed max-w-2xl">{chk.explanation}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        {chk.action_link && (
                          <Link
                            to={chk.action_link}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1"
                          >
                            Inspect <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isBlocked
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {chk.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-center">
        <p className="text-xs font-semibold text-amber-800">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}
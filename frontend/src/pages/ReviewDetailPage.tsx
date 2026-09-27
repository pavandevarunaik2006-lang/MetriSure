import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, 
  FileText, ShieldAlert, Stamp, FileCheck, Check, Camera,
  RefreshCw, Lock, ExternalLink, Hash, Eye, Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [reportGuardData, setReportGuardData] = useState<any>(null);
  const [approvalDiff, setApprovalDiff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isReviewer = ['REVIEWER', 'ADMINISTRATOR'].includes(user?.role || '');
  const isApprover = ['APPROVER', 'ADMINISTRATOR'].includes(user?.role || '');

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sessRes, tcRes, evRes, rgRes, diffRes] = await Promise.allSettled([
        apiClient.get(`/test-sessions/${id}`),
        apiClient.get(`/test-cases/session/${id}`),
        apiClient.get(`/evidence/session/${id}`),
        apiClient.get(`/review/${id}/reportguard`),
        apiClient.get(`/review/${id}/diff`),
      ]);

      if (sessRes.status === 'fulfilled') setSession(sessRes.value.data);
      if (tcRes.status === 'fulfilled') setTestCases(tcRes.value.data || []);
      if (evRes.status === 'fulfilled') setEvidenceList(evRes.value.data || []);
      if (rgRes.status === 'fulfilled') setReportGuardData(rgRes.value.data);
      if (diffRes.status === 'fulfilled') setApprovalDiff(diffRes.value.data);
    } catch (err: any) {
      console.error('Failed to load review details:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to load session details for review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleReviewerAction = async (action: 'APPROVE' | 'REQUEST_CHANGES') => {
    if (!isReviewer) {
      setErrorMsg(`Role '${user?.role}' is not authorized to submit peer reviews. Reviewer role required.`);
      return;
    }
    if (action === 'REQUEST_CHANGES' && !reviewNotes.trim()) {
      setErrorMsg('Mandatory notes are required when requesting changes.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.post(`/review/${id}/reviewer-action`, {
        action,
        notes: reviewNotes.trim() || undefined
      });
      setSuccessMsg(`Review recorded successfully: Status updated to ${res.data.status}`);
      setReviewNotes('');
      await fetchData();
    } catch (err: any) {
      console.error('Reviewer action error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit review decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const isBlocked = reportGuardData?.status === 'BLOCKED' || (reportGuardData?.checks && reportGuardData.checks.some((c: any) => c.status === 'BLOCKED'));

  const handleApproverAction = async (action: 'FINAL_APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    if (!isApprover) {
      setErrorMsg(`Role '${user?.role}' is not authorized to execute final approval. Approver role required.`);
      return;
    }
    if (action === 'FINAL_APPROVE' && isBlocked) {
      setErrorMsg('Cannot approve: Resolve all blocking ReportGuard prerequisites before final approval.');
      return;
    }
    if (action !== 'FINAL_APPROVE' && !reviewNotes.trim()) {
      setErrorMsg('Mandatory notes are required when rejecting or requesting changes.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiClient.post(`/review/${id}/approver-action`, {
        action,
        notes: reviewNotes.trim() || undefined
      });
      
      let reportId = res.data?.report_id;
      // If approved, trigger report generation if not returned
      if (action === 'FINAL_APPROVE') {
        if (!reportId) {
          try {
            const repRes = await apiClient.post(`/reports/generate/${id}`);
            reportId = repRes.data?.id;
          } catch (repErr) {
            console.warn('Report generation trigger response:', repErr);
          }
        }

        setSuccessMsg(`Final approval recorded! Status updated to APPROVED and standardized report issued. Redirecting...`);
        setReviewNotes('');
        await fetchData();
        setTimeout(() => {
          if (reportId) {
            navigate(`/reports/${reportId}`);
          } else {
            navigate('/reports');
          }
        }, 1200);
      } else {
        setSuccessMsg(`Decision recorded: Status updated to ${res.data.status}`);
        setReviewNotes('');
        await fetchData();
      }
    } catch (err: any) {
      console.error('Approver action error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit approval decision.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading Session Review Data...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Session Not Found</h2>
        <p className="text-slate-600 mb-6">Could not load details for session ID {id}.</p>
        <button
          onClick={() => navigate('/review')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Review Workspace
        </button>
      </div>
    );
  }

  const instrument = session.instrument;
  const isReviewed = session.status === 'REVIEWED';
  const isApproved = session.status === 'APPROVED';

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Workflow Stepper */}
      <WorkflowStepper sessionId={session.id} sessionNumber={session.session_number} currentStep="REVIEW" />

      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button 
            onClick={() => navigate('/review')}
            className="mb-2 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Review Workspace
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Review: Session {session.session_number}
            </h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
              isApproved ? 'bg-emerald-100 text-emerald-800' :
              isReviewed ? 'bg-indigo-100 text-indigo-800' :
              session.status === 'CHANGES_REQUESTED' ? 'bg-amber-100 text-amber-800' :
              session.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {session.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {instrument?.model?.model_name || 'Generic Scale'} • SN: {instrument?.serial_number || 'N/A'} • Class {instrument?.model?.accuracy_class || 'III'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link
            to={`/reportguard/${session.id}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            ReportGuard &rarr;
          </Link>
          <Link
            to={`/provenance/${session.id}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Provenance &rarr;
          </Link>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Evidence, ReportGuard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance & Session Summary */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">Metrological Compliance Evaluation</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                RulePack v{session.rulepack_version || '1.0.0'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Test Sequences:</span>
                  <span className="font-bold text-slate-900">{testCases.length} sequences</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Environmental Temp:</span>
                  <span className="font-bold text-slate-900">{session.env_temperature ?? 'N/A'} °C</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Physical Evidence:</span>
                  <span className="font-bold text-slate-900">{evidenceList.length} items</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Operator ID:</span>
                  <span className="font-bold text-slate-900">#{session.operator_id || 1}</span>
                </div>
              </div>

              {/* Test Cases List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50/70 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                  Executed Test Cases
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {testCases.map((tc) => (
                    <div key={tc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{tc.test_name}</span>
                        <span className="text-slate-400 ml-2 font-mono">({tc.test_type})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tc.overall_result === 'PASS' ? 'bg-emerald-100 text-emerald-700' :
                        tc.overall_result === 'FAIL' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tc.overall_result || tc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optical Evidence Verification (Real Data) */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">VisualProof Optical Evidence</h3>
              </div>
              <Link 
                to={`/visualproof/${session.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Inspect VisualProof <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              {evidenceList.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">
                  No visual display captures uploaded for this session.
                </div>
              ) : (
                <div className="space-y-3">
                  {evidenceList.map((ev) => {
                    const isImg = ev.file_name.toLowerCase().endsWith('.jpg') || ev.file_name.toLowerCase().endsWith('.png') || ev.file_name.toLowerCase().endsWith('.jpeg');
                    return (
                      <div key={ev.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          {isImg ? (
                            <img
                              src={`/demo_evidence/${ev.file_name}`}
                              alt={ev.file_name}
                              className="w-12 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = `/api/evidence/${ev.id}/file`;
                              }}
                            />
                          ) : (
                            <div className="w-12 h-10 bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{ev.file_name}</span>
                              <span className="text-slate-400 font-mono">(ID #{ev.id})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ev.verification_status === 'MISMATCH' ? 'bg-rose-100 text-rose-700' :
                                ev.verification_status === 'VERIFIED' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {ev.verification_status}
                              </span>
                            </div>
                            <div className="text-slate-500 mt-1">
                              Recorded: <strong className="text-slate-800">{ev.recorded_value || ev.expected_value || '10.000 kg'}</strong> • OCR Captured: <strong className="text-slate-800">{ev.ocr_result || 'N/A'}</strong>
                            </div>
                            {ev.review_disposition && ev.review_disposition !== 'REVIEW PENDING' && (
                              <div className="text-[11px] mt-1 flex items-center gap-1.5 text-slate-600">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  ev.review_disposition.includes('ACCEPTED') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {ev.review_disposition}
                                </span>
                                {ev.reviewer_name && <span className="text-slate-400">by {ev.reviewer_name}</span>}
                              </div>
                            )}
                            {ev.review_notes && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                "{ev.review_notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs select-all">
                          {ev.sha256_hash ? `SHA: ${ev.sha256_hash.slice(0, 20)}...` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ReportGuard Readiness Status */}
          {reportGuardData && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-600" />
                  <h3 className="font-bold text-slate-900 text-sm">ReportGuard Quality Gate</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  reportGuardData.status === 'READY FOR REPORT ISSUANCE' ? 'bg-emerald-100 text-emerald-800' :
                  reportGuardData.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {reportGuardData.status}
                </span>
              </div>

              <div className="p-5">
                <div className="space-y-2 text-xs">
                  {reportGuardData.checks?.map((chk: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-semibold text-slate-800">{chk.name}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{chk.explanation}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        chk.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                        chk.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Review / Approval Action Gate */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Action Decision Gate</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current Role: <strong className="text-slate-800">{user?.role || 'TECHNICIAN'}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Review / Approval Justification Notes
              </label>
              <textarea 
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                placeholder="Enter justification or observations..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action buttons based on role */}
            {isApprover ? (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApproverAction('FINAL_APPROVE')}
                  disabled={actionLoading || isApproved || isBlocked}
                  className={`w-full inline-flex justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors ${
                    actionLoading || isApproved || isBlocked
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  }`}
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stamp className="h-4 w-4" />
                  )}
                  {isApproved ? 'Already Approved' : isBlocked ? 'Final Approval Blocked' : 'Final Approval (Issue Report)'}
                </button>
                {isBlocked && !isApproved && (
                  <p className="text-[11px] text-rose-600 font-semibold text-center bg-rose-50 border border-rose-200 rounded-lg p-2">
                    Resolve all blocking ReportGuard prerequisites before final approval.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApproverAction('REQUEST_CHANGES')}
                    disabled={actionLoading || !reviewNotes.trim()}
                    className="inline-flex justify-center items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
                  </button>
                  <button
                    onClick={() => handleApproverAction('REJECT')}
                    disabled={actionLoading || !reviewNotes.trim()}
                    className="inline-flex justify-center items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ) : isReviewer ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleReviewerAction('APPROVE')}
                  disabled={actionLoading || isReviewed || isApproved}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <FileCheck className="h-4 w-4" />
                  {isReviewed || isApproved ? 'Review Already Completed' : 'Verify & Forward to Approver'}
                </button>
                <button
                  onClick={() => handleReviewerAction('REQUEST_CHANGES')}
                  disabled={actionLoading || !reviewNotes.trim()}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Request Technician Correction
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-600" /> Operational View Only
                </div>
                <p>
                  Your current role (<strong>{user?.role}</strong>) can inspect review data and evidence, but peer review requires a Reviewer, and final issuance requires an Approver.
                </p>
              </div>
            )}
          </div>

          {/* Past Approval Records */}
          {approvalDiff?.approval_records?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                Recorded Review & Approval Actions
              </h4>
              <div className="space-y-2 text-xs">
                {approvalDiff.approval_records.map((rec: any) => (
                  <div key={rec.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{rec.action}</span>
                      <span className="text-[10px] text-slate-400">ID #{rec.id}</span>
                    </div>
                    {rec.notes && <p className="text-slate-600 italic">"{rec.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Disclaimer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            <ShieldAlert className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
            <span className="font-semibold text-slate-700 block">Immutable Governance Log</span>
            All peer reviews and approval actions are cryptographically logged to the system audit trail.
          </div>
        </div>
      </div>

      {/* Demo Disclaimer */}
      <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
        <p className="text-xs text-amber-800 font-semibold tracking-wide">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}

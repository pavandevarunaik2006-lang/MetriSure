import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileDiff, ArrowRight, ShieldCheck, AlertCircle, Clock, User, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';

interface ApprovalRecordItem {
  id: number;
  action: string;
  notes: string;
  reviewer_id?: number;
  approver_id?: number;
  actor_email?: string;
  actor_role?: string;
  created_at?: string;
}

interface SessionAuditItem {
  id: number;
  action: string;
  user_email?: string;
  user_role?: string;
  timestamp?: string;
  details?: any;
}

interface DiffResponse {
  current: {
    id: number;
    session_number: string;
    instrument_id: number;
    status: string;
    rulepack_version: string;
    env_temperature?: number;
    env_humidity?: number;
    env_atmospheric_pressure?: number;
    failed_cases: number;
  };
  baseline: {
    id?: number;
    session_number?: string;
    status?: string;
    rulepack_version?: string;
    env_temperature?: number;
    env_humidity?: number;
    env_atmospheric_pressure?: number;
    failed_cases?: number;
  } | null;
  approval_records: ApprovalRecordItem[];
  session_audits?: SessionAuditItem[];
  disclaimer: string;
}

export function ApprovalDiffPage() {
  const { id } = useParams<{ id: string }>();
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      apiClient.get<DiffResponse>(`/review/${id}/diff`)
        .then(res => {
          setDiff(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load approval diff:', err);
          setError(err.response?.data?.detail || 'Failed to load approval diff analysis');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm text-slate-500">Loading Approval Diff Analysis...</p>
      </div>
    );
  }

  if (error || !diff) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
          <h2 className="text-lg font-bold">Error Loading Diff</h2>
          <p className="text-sm mt-1">{error || 'Session not found'}</p>
          <Link to="/review" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-800 underline">
            <ArrowLeft className="h-4 w-4" /> Return to Review Queue
          </Link>
        </div>
      </div>
    );
  }

  const { current, baseline, approval_records, session_audits } = diff;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/review" className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Review Queue
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-500 font-mono">Session {current.session_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileDiff className="h-6 w-6 text-indigo-600" /> Approval Diff Analysis
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Verifying parameter variance, environmental stability, and governance records for Instrument ID #{current.instrument_id}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/review/${current.id}`}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Review Workspace
          </Link>
          <Link
            to={`/testguard/${current.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            TestGuard Check
          </Link>
        </div>
      </div>

      {/* Parameter Baseline Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Baseline Variance Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison against official prior approved baseline for Instrument ID #{current.instrument_id}
            </p>
          </div>
          {baseline ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Baseline: Session {baseline.session_number}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Initial Baseline Session
            </span>
          )}
        </div>

        {baseline ? (
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Parameter</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Baseline ({baseline.session_number})</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Current ({current.session_number})</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Variance / Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">RulePack Version</td>
                <td className="px-6 py-4 text-slate-600 font-mono">v{baseline.rulepack_version || '1.0.0'}</td>
                <td className="px-6 py-4 text-slate-900 font-bold font-mono">v{current.rulepack_version}</td>
                <td className="px-6 py-4">
                  {baseline.rulepack_version === current.rulepack_version ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Revision: v{baseline.rulepack_version} → v{current.rulepack_version}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Ambient Temperature</td>
                <td className="px-6 py-4 text-slate-600 font-mono">
                  {baseline.env_temperature !== null && baseline.env_temperature !== undefined ? `${baseline.env_temperature} °C` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-slate-900 font-bold font-mono">
                  {current.env_temperature !== null && current.env_temperature !== undefined ? `${current.env_temperature} °C` : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {baseline.env_temperature !== null && baseline.env_temperature !== undefined && current.env_temperature !== null && current.env_temperature !== undefined ? (
                    (() => {
                      const delta = current.env_temperature - baseline.env_temperature;
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                          Math.abs(delta) <= 2.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} °C
                          <span className="text-[10px] font-normal text-slate-500">
                            ({Math.abs(delta) <= 2.0 ? 'Stable' : 'Noticeable Shift'})
                          </span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400 text-xs">Baseline data unavailable</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Relative Humidity</td>
                <td className="px-6 py-4 text-slate-600 font-mono">
                  {baseline.env_humidity !== null && baseline.env_humidity !== undefined ? `${baseline.env_humidity} %` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-slate-900 font-bold font-mono">
                  {current.env_humidity !== null && current.env_humidity !== undefined ? `${current.env_humidity} %` : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  {baseline.env_humidity !== null && baseline.env_humidity !== undefined && current.env_humidity !== null && current.env_humidity !== undefined ? (
                    (() => {
                      const delta = current.env_humidity - baseline.env_humidity;
                      return (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} %
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400 text-xs">Baseline data unavailable</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Failed Test Cases</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{baseline.failed_cases || 0}</td>
                <td className="px-6 py-4 text-slate-900 font-bold font-mono">{current.failed_cases}</td>
                <td className="px-6 py-4">
                  {current.failed_cases > (baseline.failed_cases || 0) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      <XCircle className="h-3.5 w-3.5 text-rose-500" /> Regression (+{current.failed_cases - (baseline.failed_cases || 0)} fails)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No Regression
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center bg-slate-50/50">
            <ShieldCheck className="h-10 w-10 text-blue-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-base font-bold text-slate-800">Initial Baseline Session</h3>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
              No previous approved session exists for this instrument. This test session will serve as the initial approved baseline once certified.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 max-w-2xl mx-auto">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block">RulePack</span>
                <span className="text-sm font-bold text-slate-800">v{current.rulepack_version}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block">Temperature</span>
                <span className="text-sm font-bold text-slate-800">{current.env_temperature ? `${current.env_temperature} °C` : 'N/A'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block">Humidity</span>
                <span className="text-sm font-bold text-slate-800">{current.env_humidity ? `${current.env_humidity} %` : 'N/A'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block">Failed Cases</span>
                <span className="text-sm font-bold text-slate-800">{current.failed_cases}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persisted Approval Records / Changes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Persisted Approval Records</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-gated review decisions, approvals, and reviewer justifications stored in database
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
            {approval_records.length} records
          </span>
        </div>

        {approval_records.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {approval_records.map(rec => (
              <div key={rec.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      rec.action.includes('APPROVE')
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.action.includes('REJECT')
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.action}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {rec.actor_email || 'Authorized Metrologist'} ({rec.actor_role || 'REVIEWER'})
                    </span>
                  </div>
                  {rec.notes ? (
                    <p className="text-sm text-slate-700 italic bg-slate-50 border border-slate-100 rounded px-2.5 py-1">
                      "{rec.notes}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes recorded</p>
                  )}
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1 self-start sm:self-auto">
                  <Clock className="h-3 w-3" />
                  {rec.created_at || 'Recorded'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-medium">No persisted approval changes available.</p>
            <p className="text-xs text-slate-400 mt-1">
              Review actions taken by Reviewers or Approvers will be permanently recorded here.
            </p>
          </div>
        )}
      </div>

      {/* Session Audit History */}
      {session_audits && session_audits.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 text-base">Session Audit History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Immutable audit log entries for Session #{current.id}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {session_audits.slice(0, 5).map(audit => (
              <div key={audit.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 mr-2">{audit.action}</span>
                  <span className="text-slate-500">by {audit.user_email || 'system'}</span>
                </div>
                <div className="text-slate-400 font-mono">{audit.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
        <p className="text-sm font-medium text-amber-800">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}
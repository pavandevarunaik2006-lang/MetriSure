import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, ArrowLeft, ArrowRight, Play, CheckCircle2,
  RefreshCw, ChevronRight, Check, X, ShieldAlert, Sparkles, Scale
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function TestPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [sessRes, casesRes] = await Promise.all([
        apiClient.get(`/test-sessions/${id}`),
        apiClient.get(`/test-cases/session/${id}`)
      ]);
      setSession(sessRes.data);
      const items = Array.isArray(casesRes.data) ? casesRes.data : [];
      setCases(items);
    } catch (err: any) {
      console.error('Failed to load test plan:', err);
      setError(err.message || 'Failed to load test plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const handleGeneratePlan = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await apiClient.post(`/test-cases/session/${id}/generate`);
      await fetchPlan();
    } catch (err: any) {
      console.error('Failed to generate test plan:', err);
      alert(err.response?.data?.detail || 'Failed to generate test plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Loading standardized test plan sequence...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-rose-600 font-semibold mb-4">{error || `Failed to load test plan for session ${id}.`}</p>
          <button
            onClick={() => navigate('/test-sessions')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Test Sessions
          </button>
        </div>
      </div>
    );
  }

  const model = session.instrument?.model || {};
  const completedCount = cases.filter(c => c.status === 'COMPLETED').length;
  const progressPct = cases.length > 0 ? Math.round((completedCount / cases.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate(`/test-ready/${id}`)}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Test Ready
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Standardized Test Plan
            </h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              OIML R-76-1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic sequence of statutory calibration routines for Class {model.accuracy_class || 'III'} NAWI.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {cases.length > 0 ? (
            <Link
              to={`/test-execution/${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4" /> Proceed to Test Execution <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? 'Generating Test Cases...' : 'Generate Standard Test Plan'}
            </button>
          )}
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={session.id}
        sessionNumber={session.session_number}
        currentStep="PLAN"
      />

      {/* Progress & Summary Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Test Plan Progress</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {completedCount} of {cases.length} Procedures Executed ({progressPct}%)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">RulePack: v{session.rulepack_version || '1.0.0'}</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sequence Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Mandatory Test Procedure Sequence
          </h2>
          <span className="text-xs font-mono font-medium text-slate-500">
            {cases.length} Structured Test Cases
          </span>
        </div>

        {cases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Test Procedure</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Category / Clause</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Mandatory</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{c.test_type}</div>
                      <div className="text-[11px] text-slate-500">{c.description || 'Statutory OIML R-76 calibration routine'}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-600">
                      {c.clause || 'OIML R-76 A.4'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        <Check className="h-3 w-3" /> REQUIRED
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.overall_result || c.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium">
                      <Link
                        to={`/test-execution/${id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-semibold"
                      >
                        Execute <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No test cases generated yet for this session</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Click below to generate the standard OIML R-76 test plan.</p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Standard Test Plan'}
            </button>
          </div>
        )}
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

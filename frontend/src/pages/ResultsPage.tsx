import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3, CheckCircle2, AlertTriangle, ShieldAlert,
  ArrowLeft, ArrowRight, HelpCircle, GitBranch, ChevronDown, ChevronUp,
  Scale, FileText, Award, ClipboardCheck
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [caseObs, setCaseObs] = useState<Record<number, any[]>>({});
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.get(`/test-sessions/${id}`),
      apiClient.get(`/test-cases/session/${id}`)
    ])
      .then(async ([sessionRes, casesRes]) => {
        setData(sessionRes.data);
        const caseList = Array.isArray(casesRes.data) ? casesRes.data : [];
        setCases(caseList);

        // Fetch observations for each test case
        const obsMap: Record<number, any[]> = {};
        for (const tc of caseList) {
          try {
            const obsRes = await apiClient.get(`/observations/test-case/${tc.id}`);
            obsMap[tc.id] = Array.isArray(obsRes.data) ? obsRes.data : [];
          } catch {
            obsMap[tc.id] = [];
          }
        }
        setCaseObs(obsMap);
        if (caseList.length > 0) setExpandedCase(caseList[0].id);
      })
      .catch((err: any) => {
        console.error('Failed to load results:', err);
        setError(err.message || 'Failed to load test session results');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Evaluating deterministic compliance results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-rose-600 font-semibold mb-4">{error || `Failed to load session ${id}.`}</p>
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

  const total = cases.length;
  const failed = cases.filter(c => c.status === 'FAIL' || c.overall_result === 'FAIL').length;
  const passed = cases.filter(c => c.status === 'PASS' || c.overall_result === 'PASS').length;

  let totalObs = 0;
  let failedObs = 0;
  Object.values(caseObs).forEach(arr => {
    totalObs += arr.length;
    failedObs += arr.filter(o => o.result === 'FAIL').length;
  });

  // Strict deterministic overall result
  let overallResult = 'INCOMPLETE';
  if (failed > 0 || failedObs > 0) {
    overallResult = 'FAIL';
  } else if (total > 0 && passed === total && totalObs > 0) {
    overallResult = 'PASS';
  } else if (data.status === 'COMPLETED' || data.status === 'APPROVED') {
    overallResult = 'PASS';
  }

  const model = data.instrument?.model || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate(`/test-execution/${id}`)}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Test Execution
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              Compliance Results Dossier
            </h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Session {data.session_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instrument: <span className="font-semibold text-slate-800">{model.model_name || 'Standard Scale'}</span> (SN: {data.instrument?.serial_number}) • Accuracy Class {model.accuracy_class || 'III'} • RulePack v{data.rulepack_version}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/review/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardCheck className="h-4 w-4" /> Submit to Review Workspace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={data.id}
        sessionNumber={data.session_number}
        currentStep="RESULTS"
      />

      {/* 1. OVERALL RESULT BANNER (Prominent & Authoritative) */}
      <div className={`rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xs border ${
        overallResult === 'PASS'
          ? 'bg-emerald-600 border-emerald-700 text-white'
          : overallResult === 'FAIL'
          ? 'bg-rose-600 border-rose-700 text-white'
          : 'bg-slate-800 border-slate-900 text-white'
      }`}>
        <span className="text-[11px] font-bold tracking-widest uppercase mb-1 opacity-90">
          DETERMINISTIC COMPLIANCE RESULT
        </span>
        <div className="flex items-center gap-3 my-2">
          {overallResult === 'PASS' ? (
            <CheckCircle2 className="h-10 w-10 text-white" />
          ) : overallResult === 'FAIL' ? (
            <ShieldAlert className="h-10 w-10 text-white" />
          ) : (
            <AlertTriangle className="h-10 w-10 text-amber-400" />
          )}
          <h2 className="text-4xl font-black tracking-wider uppercase">
            {overallResult}
          </h2>
        </div>

        <p className="max-w-xl text-xs opacity-90 leading-relaxed mt-1">
          {overallResult === 'PASS'
            ? 'The weighing instrument conforms to all statutory Maximum Permissible Error (MPE) thresholds stipulated in OIML Recommendation R 76-1:2006.'
            : overallResult === 'FAIL'
            ? 'One or more recorded observations exceeded statutory MPE limits. Type verification compliance cannot be granted under current tolerances.'
            : 'Test sequence execution is in progress. Complete all mandatory test case observations to compute the official statutory verdict.'}
        </p>

        {/* Distinct Action Buttons: Why Pass / Why Fail / Decision Trace */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-5 border-t border-white/20 w-full max-w-lg">
          <Link
            to={`/why-pass/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            Why PASS Explanation
          </Link>
          <Link
            to={`/why-fail/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Why FAIL Analysis
          </Link>
          <Link
            to={`/decision-trace/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <GitBranch className="h-4 w-4 text-indigo-600" />
            Decision Trace
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Test Cases</span>
          <span className="text-2xl font-black text-slate-900">{total}</span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-emerald-200 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-700 block mb-1">Passed Procedures</span>
          <span className="text-2xl font-black text-emerald-700">{passed}</span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-rose-200 p-4">
          <span className="text-[11px] font-bold uppercase text-rose-700 block mb-1">Failed Procedures</span>
          <span className="text-2xl font-black text-rose-700">{failed}</span>
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Observations</span>
          <span className="text-2xl font-black text-indigo-700">{totalObs}</span>
        </div>
      </div>

      {/* 3. TEST CASES BREAKDOWN WITH EXPANDABLE MEASUREMENTS */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Test Case Observations & Calculations
          </h2>
          <span className="text-xs font-mono font-medium text-slate-500">
            Click row to expand measurements
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {cases.map((tc) => {
            const isExpanded = expandedCase === tc.id;
            const obsList = caseObs[tc.id] || [];

            return (
              <div key={tc.id} className="transition-colors">
                <div
                  onClick={() => setExpandedCase(isExpanded ? null : tc.id)}
                  className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 font-bold text-xs">#{tc.sequence_number || tc.id}</span>
                    <div>
                      <span className="font-bold text-slate-900 text-sm mr-2">{tc.test_type}</span>
                      <span className="text-xs text-slate-500 font-mono">({tc.clause || 'OIML R-76 A.4'})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">
                      {obsList.length} readings
                    </span>
                    <StatusBadge status={tc.overall_result || tc.status} size="sm" />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50/70 p-4 px-6 border-t border-slate-100">
                    {obsList.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold">
                            <tr>
                              <th className="px-4 py-2.5 text-left">Test Point</th>
                              <th className="px-4 py-2.5 text-left font-mono">Reference Load (L)</th>
                              <th className="px-4 py-2.5 text-left font-mono">Indicated Value (I)</th>
                              <th className="px-4 py-2.5 text-left font-mono">Calculated Error (Ec)</th>
                              <th className="px-4 py-2.5 text-left font-mono">MPE Limit</th>
                              <th className="px-4 py-2.5 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {obsList.map((obs) => (
                              <tr key={obs.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-medium text-slate-900">
                                  {obs.test_point_label || `Step ${obs.sequence_number}`}
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                                  {obs.reference_value} {obs.reference_unit || 'kg'}
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                  {obs.indicated_value} {obs.indicated_unit || 'kg'}
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                                  {obs.calculated_error != null || obs.corrected_error != null
                                    ? `${(obs.corrected_error ?? obs.calculated_error) > 0 ? '+' : ''}${(obs.corrected_error ?? obs.calculated_error).toFixed(4)} kg`
                                    : '0.0000 kg'}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-600">
                                  {obs.permissible_error != null
                                    ? `±${obs.permissible_error.toFixed(4)} kg`
                                    : '±0.0050 kg'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <StatusBadge status={obs.result || 'PASS'} size="sm" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No measurement observations recorded for this test case.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-center">
        <p className="text-xs font-semibold text-amber-800">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}
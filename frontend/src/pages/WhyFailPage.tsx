import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, AlertTriangle, ArrowLeft, ArrowRight, 
  GitBranch, CheckCircle2, Scale, RefreshCw, XCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import clsx from 'clsx';

export function WhyFailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [caseObs, setCaseObs] = useState<Record<number, any[]>>({});
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
      })
      .catch((err: any) => {
        console.error("Failed to load WhyFail data:", err);
        setError(err.message || 'Failed to load session data');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Test Sessions
          </button>
        </div>
      </div>
    );
  }

  const failedCases = cases.filter(c => c.status === 'FAIL' || c.overall_result === 'FAIL');
  const failedObservations: Array<{ tc: any; obs: any }> = [];
  cases.forEach(tc => {
    const obsList = caseObs[tc.id] || [];
    obsList.filter(o => o.result === 'FAIL').forEach(obs => {
      failedObservations.push({ tc, obs });
    });
  });

  const isFail = failedCases.length > 0 || failedObservations.length > 0;
  const model = data.instrument?.model || {};

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(`/results/${id}`)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Compliance Results
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
          Session #{data.id} ({data.session_number})
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-rose-600" />
          Why FAIL — Failure Root Cause & Tolerance Breach Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Deterministic root-cause identification for metrological tolerance violations in Session <strong>{data.session_number}</strong>.
        </p>
      </div>

      {isFail ? (
        <div className="space-y-6">
          {/* Main Failure Callout */}
          <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <XCircle className="h-10 w-10 text-rose-600 shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-rose-950">
                  Critical Metrological Tolerance Breaches Detected
                </h2>
                <p className="text-sm text-rose-800 mt-1.5 leading-relaxed">
                  Instrument <strong>{model.model_name || 'Standard Scale'}</strong> (SN: {data.instrument?.serial_number}) failed to satisfy the legal tolerance limits established in <strong>OIML R-76-1</strong>. Under NAWI statutory evaluation directives, any single mandatory constraint violation mandates an overall <strong>FAIL</strong> verdict.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-rose-200/60 text-xs text-rose-900 font-medium">
                  <span>• Failed Test Procedures: <strong>{failedCases.length}</strong></span>
                  <span>• Violating Observations: <strong>{failedObservations.length}</strong></span>
                  <span>• RulePack Applied: <strong>v{data.rulepack_version}</strong></span>
                  <span>• Accuracy Class: <strong>Class {model.accuracy_class || 'III'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Breached Observations Breakdown Table */}
          {failedObservations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-rose-900 text-sm">Non-Compliant Measurement Readings</h3>
                <span className="text-xs text-rose-700 font-bold">{failedObservations.length} Out-of-Tolerance Points</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Test Procedure</th>
                      <th className="px-4 py-3 text-left">Test Point</th>
                      <th className="px-4 py-3 text-left">Ref Load (L)</th>
                      <th className="px-4 py-3 text-left">Indication (I)</th>
                      <th className="px-4 py-3 text-left">Calculated Error (Ec)</th>
                      <th className="px-4 py-3 text-left">Allowed MPE</th>
                      <th className="px-4 py-3 text-left">Breach Delta</th>
                      <th className="px-4 py-3 text-left">Standard Clause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {failedObservations.map(({ tc, obs }) => {
                      const ec = Math.abs(obs.corrected_error || 0);
                      const mpe = Math.abs(obs.permissible_error || 0);
                      const delta = ec - mpe;
                      return (
                        <tr key={obs.id} className="bg-rose-50/20 hover:bg-rose-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{tc.test_name}</td>
                          <td className="px-4 py-3 text-slate-700">{obs.test_point_label || `P${obs.sequence_number}`}</td>
                          <td className="px-4 py-3 text-slate-700">{obs.reference_value} {obs.reference_unit || 'kg'}</td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{obs.indicated_value} {obs.indicated_unit || 'kg'}</td>
                          <td className="px-4 py-3 font-mono font-bold text-rose-700">
                            {obs.corrected_error != null ? `${obs.corrected_error > 0 ? '+' : ''}${obs.corrected_error.toFixed(4)} kg` : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {obs.permissible_error != null ? `±${obs.permissible_error.toFixed(4)} kg` : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-rose-600">
                            +{delta > 0 ? delta.toFixed(4) : '0.0000'} kg
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                            OIML R-76 §3.5.1
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed Test Procedures List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm">Failed Test Procedures</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {failedCases.map(tc => (
                <div key={tc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900">{tc.test_name}</h4>
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                        {tc.test_category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6">
                      {tc.description || `Failed accuracy limits during testing under RulePack v${data.rulepack_version}.`}
                    </p>
                  </div>
                  <span className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full uppercase">
                    FAIL
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Link to Full Decision Trace */}
          <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">Mathematical Trace & Evidence Chain</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Examine the full formula calculations ($P = I + 0.5d - \Delta L$, $E_c = E - E_0$) and MPE lookup tables in the Decision Trace.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate(`/test-execution/${id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retest / Adjust
              </button>
              <button
                onClick={() => navigate(`/decision-trace/${id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <GitBranch className="h-4 w-4" />
                Open Decision Trace
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Not FAIL state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            No Tolerance Violations Detected for Session {data.session_number}
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            All evaluated measurement observations are strictly within the Maximum Permissible Error (MPE) thresholds. There are no failing criteria to analyze.
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate(`/why-pass/${id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              View Why PASS Rationale
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/results/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
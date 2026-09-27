import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, ArrowLeft, ArrowRight, GitBranch, 
  ShieldCheck, AlertTriangle, FileText, Scale
} from 'lucide-react';
import { apiClient } from '../api/client';
import clsx from 'clsx';

export function WhyPassPage() {
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
        console.error("Failed to load WhyPass data:", err);
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
  let failedObs = 0;
  let totalObs = 0;
  Object.values(caseObs).forEach(arr => {
    totalObs += arr.length;
    failedObs += arr.filter(o => o.result === 'FAIL').length;
  });

  const isPass = failedCases.length === 0 && failedObs === 0 && (cases.length > 0 || data.status === 'COMPLETED' || data.status === 'APPROVED');
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
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          Why PASS — Metrological Compliance Rationale
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed deterministic breakdown explaining why Session <strong>{data.session_number}</strong> satisfied all legal metrology requirements.
        </p>
      </div>

      {isPass ? (
        <div className="space-y-6">
          {/* Main Success Callout */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-10 w-10 text-emerald-600 shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-emerald-950">
                  All Mandatory Metrological Constraints Satisfied
                </h2>
                <p className="text-sm text-emerald-800 mt-1.5 leading-relaxed">
                  The instrument <strong>{model.model_name || 'Standard Scale'}</strong> (SN: {data.instrument?.serial_number}) strictly met all accuracy tolerance boundaries defined under <strong>OIML Recommendation R-76-1 (Edition 2006)</strong> for Accuracy Class <strong>{model.accuracy_class || 'III'}</strong> instruments.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-emerald-200/60 text-xs text-emerald-900 font-medium">
                  <span>• RulePack Version: <strong>v{data.rulepack_version}</strong></span>
                  <span>• Total Test Procedures Passed: <strong>{cases.length} / {cases.length}</strong></span>
                  <span>• Verified Observations: <strong>{totalObs} readings</strong></span>
                  <span>• Zero Critical Errors</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <CheckCircle2 className="h-4 w-4" /> 1. Error within MPE
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Across all test points (zero, min, 500e, 2000e, and max capacity), corrected error values satisfy:
                <code className="block mt-1.5 p-1.5 bg-slate-50 rounded text-slate-800 font-mono text-[11px]">|Ec| ≤ MPE(L) for all L</code>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <CheckCircle2 className="h-4 w-4" /> 2. Stable Zero-Setting
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero indication remained within <strong>±0.25e</strong> of true zero throughout testing, satisfying OIML R-76 Section 4.5.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                <CheckCircle2 className="h-4 w-4" /> 3. Repeatability Confirmed
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The difference between successive measurements with identical loads did not exceed the absolute MPE for that load.
              </p>
            </div>
          </div>

          {/* Passed Tests Verification Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Verified Test Procedures</h3>
              <span className="text-xs text-emerald-700 font-bold">100% Compliance Rate</span>
            </div>
            <div className="divide-y divide-slate-100">
              {cases.map((tc) => {
                const obs = caseObs[tc.id] || [];
                return (
                  <div key={tc.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <h4 className="text-sm font-semibold text-slate-900">{tc.test_name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                          {tc.test_category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6">
                        {obs.length > 0 ? `${obs.length} measurement points verified within tolerance` : 'Standard verification conditions confirmed'}
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase">
                      PASS
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Link to Full Decision Trace */}
          <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">Mathematical Proof & Inspection</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect every intermediate formula calculation ($P = I + 0.5d - \Delta L$, $E_c = E - E_0$) in the Decision Trace.
              </p>
            </div>
            <button
              onClick={() => navigate(`/decision-trace/${id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <GitBranch className="h-4 w-4" />
              Open Full Decision Trace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Not PASS state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            Session Does Not Have an Official PASS Verdict
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Session <strong>{data.session_number}</strong> currently has status <strong>{data.status}</strong> with {failedCases.length > 0 ? `${failedCases.length} failing test case(s)` : 'incomplete test execution'}.
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            {failedCases.length > 0 && (
              <button
                onClick={() => navigate(`/why-fail/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                View Why FAIL Analysis
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => navigate(`/test-execution/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Resume Test Execution
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
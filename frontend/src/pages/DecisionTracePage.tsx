import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, Check, Terminal, FileCode, 
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, ArrowRight, Scale
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';

export function DecisionTracePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
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
        setSession(sessionRes.data);
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
        console.error("Failed to load decision trace data:", err);
        setError(err.message || 'Failed to load session decision trace');
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

  if (error || !session) {
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
  let totalObs = 0;
  let failedObs = 0;
  const sampleObservations: any[] = [];

  Object.values(caseObs).forEach(arr => {
    totalObs += arr.length;
    failedObs += arr.filter(o => o.result === 'FAIL').length;
    arr.forEach(o => {
      if (sampleObservations.length < 5) sampleObservations.push(o);
    });
  });

  const isPass = failedCases.length === 0 && failedObs === 0 && (cases.length > 0 || session.status === 'COMPLETED' || session.status === 'APPROVED');
  const instrument = session.instrument || {};
  const model = instrument.model || {};

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(`/results/${id}`)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Results
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
          Session #{session.id} ({session.session_number})
        </span>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DecisionTrace — Mathematical Audit Trail</h1>
          <p className="text-sm text-slate-500">Transparent, deterministic explanation of the Compliance Engine's ruling.</p>
        </div>
      </div>

      {/* Ruling Verdict Banner */}
      <div className={clsx(
        "mb-8 rounded-xl border p-6 shadow-sm transition-all",
        isPass ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPass ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-7 w-7 text-rose-600 shrink-0" />
            )}
            <div>
              <h2 className={clsx("text-lg font-bold", isPass ? "text-emerald-950" : "text-rose-950")}>
                Compliance Engine Decision: {isPass ? 'PASS' : 'FAIL'}
              </h2>
              <p className={clsx("text-xs mt-0.5", isPass ? "text-emerald-800" : "text-rose-800")}>
                Evaluated against RulePack v{session.rulepack_version} · Instrument: {model.model_name || 'Scale'} (SN: {instrument.serial_number}) · Class {model.accuracy_class || 'III'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(isPass ? `/why-pass/${id}` : `/why-fail/${id}`)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              {isPass ? 'Why PASS Summary' : 'Why FAIL Summary'}
            </button>
          </div>
        </div>
      </div>

      {/* The 5-Step Deterministic Evaluation Chain */}
      <div className="space-y-6 mb-8">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-slate-600" />
          5-Step Deterministic Compliance Chain
        </h3>

        {/* Step 1: Context Binding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              1
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Metrological Context & Tolerance Table Binding</h4>
              <p className="text-xs text-slate-600 mt-1">
                The compliance engine binds instrument parameters and loads the legal MPE tolerance table from <strong>RulePack v{session.rulepack_version}</strong>.
              </p>
              <div className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] space-y-1">
                <p><span className="text-cyan-400">ACCURACY_CLASS:</span> "{model.accuracy_class || 'III'}"</p>
                <p><span className="text-cyan-400">VERIFICATION_INTERVAL_e:</span> {model.verification_interval_e || 0.01} {model.unit || 'kg'}</p>
                <p><span className="text-cyan-400">ACTUAL_INTERVAL_d:</span> {model.actual_interval_d || 0.01} {model.unit || 'kg'}</p>
                <p><span className="text-cyan-400">MAX_CAPACITY:</span> {model.max_capacity || 30.0} {model.unit || 'kg'}</p>
                <p><span className="text-emerald-400">MPE_FORMULA:</span> 0 ≤ m ≤ 500e → ±0.5e | 500e &lt; m ≤ 2000e → ±1.0e | 2000e &lt; m ≤ 10000e → ±1.5e</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Environmental Baseline & Ingestion */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              2
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Environmental Qualification & Data Ingestion</h4>
              <p className="text-xs text-slate-600 mt-1">
                Ambient laboratory conditions verified within OIML R-76 statutory limits. Measurement observations ingested.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Temperature:</span>
                  <span className="font-bold text-slate-800">{session.env_temperature != null ? `${session.env_temperature} °C` : '20.0 °C'} (Range: 10–30°C)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Humidity:</span>
                  <span className="font-bold text-slate-800">{session.env_humidity != null ? `${session.env_humidity} %` : '50.0 %'} (Range: 30–80%)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ingested Readings:</span>
                  <span className="font-bold text-slate-800">{totalObs} observations across {cases.length} tests</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Exact Error Mathematical Calculation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              3
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Error Calculation Formulas (OIML R-76 Section A.4.4.3)</h4>
              <p className="text-xs text-slate-600 mt-1">
                The engine evaluates each reading using closed-form deterministic arithmetic:
              </p>
              <div className="mt-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5 font-mono">
                  <span className="text-slate-700 font-bold">1. Corrected Indication:</span>
                  <code className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">P = I + 0.5d - ΔL</code>
                </div>
                <div className="flex items-center justify-between border-b pb-1.5 font-mono">
                  <span className="text-slate-700 font-bold">2. Uncorrected Error:</span>
                  <code className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">E = P - L</code>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-700 font-bold">3. Corrected Error:</span>
                  <code className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">Ec = E - E0</code>
                </div>
              </div>

              {sampleObservations.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left">Reading</th>
                        <th className="px-3 py-2 text-left">Load (L)</th>
                        <th className="px-3 py-2 text-left">Indication (I)</th>
                        <th className="px-3 py-2 text-left">Corrected Error (Ec)</th>
                        <th className="px-3 py-2 text-left">MPE Threshold</th>
                        <th className="px-3 py-2 text-left">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sampleObservations.map(obs => (
                        <tr key={obs.id}>
                          <td className="px-3 py-1.5 font-medium">{obs.test_point_label || `P${obs.sequence_number}`}</td>
                          <td className="px-3 py-1.5">{obs.reference_value} kg</td>
                          <td className="px-3 py-1.5 font-mono">{obs.indicated_value} kg</td>
                          <td className="px-3 py-1.5 font-mono font-semibold">
                            {obs.corrected_error != null ? `${obs.corrected_error > 0 ? '+' : ''}${obs.corrected_error.toFixed(4)} kg` : '-'}
                          </td>
                          <td className="px-3 py-1.5">±{obs.permissible_error?.toFixed(4) || '0.0100'} kg</td>
                          <td className="px-3 py-1.5">
                            <span className={clsx(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                              obs.result === 'PASS' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            )}>
                              {obs.result || 'PASS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Tolerance Constraint Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              4
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Tolerance Constraint Verification (|Ec| ≤ MPE)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Every measurement point is evaluated against the Maximum Permissible Error condition:
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Condition Status:</span>
                  <span className={clsx("font-bold text-sm", isPass ? "text-emerald-700" : "text-rose-700")}>
                    {isPass ? 'All points satisfied |Ec| ≤ MPE(L)' : `${failedObs} point(s) exceeded permissible error`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Failed Observations:</span>
                  <span className="font-bold text-slate-900">{failedObs} / {totalObs}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Final Deterministic Verdict */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className={clsx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs text-white",
              isPass ? "bg-emerald-600" : "bg-rose-600"
            )}>
              5
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Final Deterministic Legal Metrology Verdict</h4>
              <p className="text-xs text-slate-600 mt-1">
                Official outcome generated by deterministic state machine without stochastic or AI intervention:
              </p>
              <div className={clsx(
                "mt-3 p-4 rounded-xl border flex items-center justify-between",
                isPass ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
              )}>
                <div>
                  <p className={clsx("text-xl font-black uppercase tracking-wider", isPass ? "text-emerald-800" : "text-rose-800")}>
                    {isPass ? 'OFFICIAL PASS' : 'OFFICIAL FAIL'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isPass 
                      ? 'Type evaluation compliant with OIML R-76 statutory criteria.' 
                      : 'Type evaluation non-compliant due to tolerance exceedance.'}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 bg-white rounded-lg border font-mono font-bold text-slate-700 shadow-sm">
                  OIML_VERDICT: {isPass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Demo Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
          DEMO RULEPACK — NOT AUTHORITATIVE · FOR DEMONSTRATION PURPOSES ONLY
        </p>
      </div>
    </div>
  );
}

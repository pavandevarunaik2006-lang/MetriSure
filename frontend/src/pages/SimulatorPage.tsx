import { useState } from 'react';
import { 
  Beaker, Play, Settings, RefreshCcw, ArrowRight, AlertTriangle, CheckCircle, Calculator
} from 'lucide-react';
import clsx from 'clsx';

export function SimulatorPage() {
  const [params, setParams] = useState({
    accuracyClass: 'III',
    maxCapacity: '15.000',
    scaleInterval: '0.005',
    load: '15.000',
    indication: '15.008'
  });

  const [result, setResult] = useState<{
    mpe: number;
    error: number;
    status: 'PASS' | 'FAIL';
  } | null>(null);

  const simulate = () => {
    // Simple mock logic for Class III OIML R-76
    const e = parseFloat(params.scaleInterval);
    const load = parseFloat(params.load);
    const ind = parseFloat(params.indication);
    const n = load / e; // Number of verification intervals
    
    let mpeFactor = 0.5;
    if (n > 500 && n <= 2000) mpeFactor = 1.0;
    if (n > 2000 && n <= 10000) mpeFactor = 1.5;

    const mpe = mpeFactor * e;
    const error = ind - load;

    setResult({
      mpe,
      error,
      status: Math.abs(error) <= mpe ? 'PASS' : 'FAIL'
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <Beaker className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">What-If Compliance Simulator</h1>
          <p className="text-sm text-slate-500">Test theoretical instrument parameters against the deterministic compliance engine.</p>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-indigo-50 border border-indigo-200 p-4 flex items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-bold tracking-widest uppercase text-indigo-800">
          SIMULATION — NOT AN OFFICIAL RESULT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" /> Instrument Parameters
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Accuracy Class</label>
              <select 
                value={params.accuracyClass}
                onChange={e => setParams({...params, accuracyClass: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="I">Class I (Special)</option>
                <option value="II">Class II (High)</option>
                <option value="III">Class III (Medium)</option>
                <option value="IIII">Class IIII (Ordinary)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Capacity (kg)</label>
                <input 
                  type="number"
                  value={params.maxCapacity}
                  onChange={e => setParams({...params, maxCapacity: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scale Interval e (kg)</label>
                <input 
                  type="number"
                  step="0.001"
                  value={params.scaleInterval}
                  onChange={e => setParams({...params, scaleInterval: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Hypothetical Test Observation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Standard Load (kg)</label>
                  <input 
                    type="number"
                    value={params.load}
                    onChange={e => setParams({...params, load: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Indicated Value (kg)</label>
                  <input 
                    type="number"
                    value={params.indication}
                    onChange={e => setParams({...params, indication: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={simulate}
              className="mt-6 w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              Run Simulation
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-400" /> Simulation Results
          </h2>

          {result ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className={clsx(
                "rounded-xl border p-6 text-center shadow-sm mb-6",
                result.status === 'PASS' ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
              )}>
                <div className={clsx(
                  "mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4",
                  result.status === 'PASS' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  {result.status === 'PASS' ? <CheckCircle className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">Engine Verdict</h3>
                <p className={clsx(
                  "text-3xl font-black",
                  result.status === 'PASS' ? "text-emerald-700" : "text-rose-700"
                )}>{result.status}</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Calculated Error (E)</span>
                  <span className="font-mono font-bold text-slate-900">{result.error > 0 ? '+' : ''}{result.error.toFixed(4)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Max Permissible Error (MPE)</span>
                  <span className="font-mono font-bold text-slate-900">±{result.mpe.toFixed(4)} kg</span>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    At a load of {params.load} kg ({parseFloat(params.load)/parseFloat(params.scaleInterval)}e), the applicable MPE factor is {result.mpe/parseFloat(params.scaleInterval)}e.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <RefreshCcw className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">Enter parameters and run simulation to see deterministic results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

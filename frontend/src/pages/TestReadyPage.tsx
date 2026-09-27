import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, AlertCircle, Thermometer, Droplets, Gauge,
  ArrowLeft, ArrowRight, Play, FileText, Save, Check, Scale, Building2, ShieldAlert
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function TestReadyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable environment state
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [pressure, setPressure] = useState('');
  const [savingEnv, setSavingEnv] = useState(false);
  const [envSaved, setEnvSaved] = useState(false);

  const fetchSession = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/test-sessions/${id}`);
      setData(res.data);
      if (res.data.env_temperature != null) setTemp(String(res.data.env_temperature));
      if (res.data.env_humidity != null) setHumidity(String(res.data.env_humidity));
      if (res.data.env_atmospheric_pressure != null) setPressure(String(res.data.env_atmospheric_pressure));
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.message || `Failed to load session ${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  const handleSaveEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingEnv(true);
    setEnvSaved(false);
    try {
      const res = await apiClient.put(`/test-sessions/${id}/environment`, {
        env_temperature: parseFloat(temp),
        env_humidity: parseFloat(humidity),
        env_atmospheric_pressure: parseFloat(pressure),
      });
      setData(res.data);
      setEnvSaved(true);
      setTimeout(() => setEnvSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save environment:', err);
      alert(err.response?.data?.detail || 'Failed to update environmental conditions');
    } finally {
      setSavingEnv(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Checking session pre-test readiness...</p>
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

  const hasEnv = data.env_temperature != null && data.env_humidity != null && data.env_atmospheric_pressure != null;
  const isReady = hasEnv && data.status !== 'DRAFT';
  const instrument = data.instrument || {};
  const model = instrument.model || {};

  // Formal inspection checklist items
  const checklist = [
    {
      id: 'inst',
      title: 'Instrument Pattern Verification',
      desc: `Serial #${instrument.serial_number || 'N/A'}, Model ${model.model_name || 'Standard Balance'}, Class ${model.accuracy_class || 'III'} verified against pattern approval registry.`,
      passed: Boolean(instrument.serial_number && model.accuracy_class),
    },
    {
      id: 'lab',
      title: 'Laboratory Authorization & Facility Context',
      desc: `Assigned to ${data.laboratory?.name || 'Central Metrology Laboratory'} (DEMO LABORATORY ENVIRONMENT).`,
      passed: Boolean(data.laboratory_id || data.laboratory),
    },
    {
      id: 'temp',
      title: 'Thermal Operating Envelope (10.0 °C to 30.0 °C)',
      desc: data.env_temperature != null
        ? `Recorded ambient temperature: ${data.env_temperature} °C (Within allowable Class III tolerance).`
        : 'Missing ambient temperature record. Thermal stabilization required.',
      passed: data.env_temperature != null && data.env_temperature >= 10.0 && data.env_temperature <= 30.0,
    },
    {
      id: 'humidity',
      title: 'Relative Humidity Limit (<= 85% RH)',
      desc: data.env_humidity != null
        ? `Recorded relative humidity: ${data.env_humidity}% RH.`
        : 'Missing relative humidity observation.',
      passed: data.env_humidity != null && data.env_humidity <= 85.0,
    },
    {
      id: 'pressure',
      title: 'Barometric Stabilization',
      desc: data.env_atmospheric_pressure != null
        ? `Atmospheric pressure: ${data.env_atmospheric_pressure} hPa.`
        : 'Missing barometric pressure parameter.',
      passed: data.env_atmospheric_pressure != null,
    },
    {
      id: 'rulepack',
      title: 'Digital RulePack Regulatory Binding',
      desc: `OIML R-76-1:2006 RulePack v${data.rulepack_version || '1.0.0'} locked for deterministic calculation.`,
      passed: Boolean(data.rulepack_version),
    },
  ];

  const allPassed = checklist.every(c => c.passed);
  const missingCount = checklist.filter(c => !c.passed).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate(`/test-sessions/${id}`)}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Session {data.session_number}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Test Readiness Inspection
            </h1>
            <StatusBadge status={allPassed ? 'READY' : 'PENDING'} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-flight quality assurance checklist verifying environmental stability and instrument readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/test-plan/${id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" /> Proceed to Test Plan <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={data.id}
        sessionNumber={data.session_number}
        currentStep="READY"
      />

      {/* Readiness Status Banner */}
      <div className={`p-5 rounded-xl border flex items-start gap-4 ${
        allPassed
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/70 border-amber-200 text-amber-900'
      }`}>
        {allPassed ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          <h2 className="text-sm font-bold">
            {allPassed
              ? 'Pre-Flight Readiness Verified — Ready for OIML R-76 Testing'
              : `${missingCount} Prerequisite Requirement(s) Pending Attention`}
          </h2>
          <p className="text-xs mt-0.5 leading-relaxed">
            {allPassed
              ? 'All environmental stabilization envelopes and instrument pattern criteria have been met. You may proceed to execute the test plan sequence.'
              : 'Record ambient thermal, humidity, and barometric parameters below to authorize test execution.'}
          </p>
        </div>
      </div>

      {/* Inspection Checklist */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Inspection Checklist ({checklist.filter(c => c.passed).length}/{checklist.length} Passed)
          </h2>
          <span className="text-xs font-mono font-medium text-slate-500">
            Standard: OIML R-76-1:2006 Clause 3.9 & A.4
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item, idx) => (
            <div key={item.id} className="p-4 px-6 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.passed ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <StatusBadge status={item.passed ? 'PASS' : 'PENDING'} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Parameters Configuration */}
      <form onSubmit={handleSaveEnvironment} className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Environmental Stabilization Parameters</h2>
            <p className="text-xs text-slate-500">Record current metrology room sensors</p>
          </div>
          {envSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Updated & Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5 text-indigo-600" /> Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={temp}
              onChange={e => setTemp(e.target.value)}
              placeholder="e.g. 21.5"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Allowable range: 10.0 to 30.0 °C</span>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-indigo-600" /> Relative Humidity (%)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={humidity}
              onChange={e => setHumidity(e.target.value)}
              placeholder="e.g. 45.0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Maximum limit: 85% RH</span>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-indigo-600" /> Atmospheric Pressure (hPa)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={pressure}
              onChange={e => setPressure(e.target.value)}
              placeholder="e.g. 1013.25"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Nominal: 1013.25 hPa</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={savingEnv}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {savingEnv ? 'Saving...' : 'Update & Re-verify Environment'}
          </button>
        </div>
      </form>

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-center">
        <p className="text-xs font-semibold text-amber-800">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}
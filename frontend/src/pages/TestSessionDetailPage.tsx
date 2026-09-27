import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FlaskConical, ArrowLeft, Play, ShieldAlert, FileText,
  CheckCircle2, Clock, Scale, Building2, Save,
  Check, ChevronRight, Eye, ShieldCheck, BarChart3, AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function TestSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [pressure, setPressure] = useState('');
  const [submittingEnv, setSubmittingEnv] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSession = async () => {
    try {
      const [res, casesRes] = await Promise.all([
        apiClient.get(`/test-sessions/${id}`),
        apiClient.get(`/test-cases/session/${id}`).catch(() => ({ data: [] }))
      ]);
      setSession(res.data);
      setTestCases(casesRes.data || []);
      if (res.data.env_temperature !== null && res.data.env_temperature !== undefined) setTemp(String(res.data.env_temperature));
      if (res.data.env_humidity !== null && res.data.env_humidity !== undefined) setHumidity(String(res.data.env_humidity));
      if (res.data.env_atmospheric_pressure !== null && res.data.env_atmospheric_pressure !== undefined) setPressure(String(res.data.env_atmospheric_pressure));
    } catch (err: any) {
      setError('Failed to load test session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSession();
  }, [id]);

  const saveEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEnv(true);
    setSaveSuccess(false);
    try {
      await apiClient.put(`/test-sessions/${id}/environment`, {
        env_temperature: parseFloat(temp) || 20.0,
        env_humidity: parseFloat(humidity) || 50.0,
        env_atmospheric_pressure: parseFloat(pressure) || 1013.25,
      });

      if (session.status === 'DRAFT') {
        await apiClient.put(`/test-sessions/${id}/status`, { status: 'READY' });
      }

      await apiClient.post(`/test-cases/generate/${id}`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchSession();
    } catch (err) {
      console.error(err);
      alert('Failed to save environmental parameters or generate test plan.');
    } finally {
      setSubmittingEnv(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Loading session workspace...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-rose-600 font-semibold mb-4">{error || 'Session not found.'}</p>
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

  const inst = session.instrument || {};
  const model = inst.model || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/test-sessions')}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Test Sessions
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Test Session {session.session_number}
            </h1>
            <StatusBadge status={session.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Instrument: <span className="font-bold text-slate-900">{model.model_name || 'Standard Balance'}</span> (SN: {inst.serial_number}) • RulePack v{session.rulepack_version || '1.0.0'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/test-execution/${session.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" /> Test Execution Workspace
          </Link>
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={session.id}
        sessionNumber={session.session_number}
        currentStep="SESSION"
      />

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instrument Dossier */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Instrument Context</h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Model Name:</span>
              <span className="font-bold text-slate-900">{model.model_name || 'Standard Balance'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Serial Number:</span>
              <span className="font-mono font-bold text-slate-900">{inst.serial_number || `INST-${session.instrument_id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Accuracy Class:</span>
              <span className="font-bold text-indigo-700">Class {model.accuracy_class || 'III'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Capacity:</span>
              <span className="font-mono text-slate-800">{model.max_capacity !== undefined ? `${model.max_capacity} ${model.unit || 'kg'}` : '15.0 kg'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Scale Interval (e):</span>
              <span className="font-mono text-slate-800">{model.verification_interval_e !== undefined ? `${model.verification_interval_e} ${model.unit || 'kg'}` : '0.005 kg'}</span>
            </div>
          </div>
        </div>

        {/* Environmental Stabilization Parameters */}
        <form onSubmit={saveEnvironment} className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Environment Stabilization</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">OIML Envelopes</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={temp}
                  onChange={e => setTemp(e.target.value)}
                  placeholder="e.g. 21.5"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Relative Humidity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={humidity}
                  onChange={e => setHumidity(e.target.value)}
                  placeholder="e.g. 45.0"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Atmospheric Pressure (hPa)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pressure}
                  onChange={e => setPressure(e.target.value)}
                  placeholder="e.g. 1013.25"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved & Initialized!
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Strictly recorded in audit trail</span>
            )}
            <button
              type="submit"
              disabled={submittingEnv}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {submittingEnv ? 'Saving...' : 'Save Parameters'}
            </button>
          </div>
        </form>

        {/* Quick Lifecycle Access */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Workflow Modules</h2>
          </div>
          <div className="space-y-2 text-xs">
            <Link
              to={`/test-ready/${session.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700">1. Test Ready Checklist</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <Link
              to={`/test-plan/${session.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700">2. Test Plan Sequence</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <Link
              to={`/test-execution/${session.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700">3. Test Execution</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <Link
              to={`/results/${session.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700">4. Compliance Results</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <Link
              to={`/review/${session.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700">5. Review & Approval</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Generated Test Cases Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Generated Test Plan Sequence</h2>
            <p className="text-xs text-slate-500">OIML R-76 test procedure execution for this session</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
            {testCases.length} cases
          </span>
        </div>

        {testCases.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {testCases.map((tc, idx) => (
              <div key={tc.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 font-bold w-6">#{idx + 1}</span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm mr-2">{tc.test_type}</span>
                    <span className="text-slate-500 font-mono">Clause {tc.clause || 'OIML R-76'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={tc.overall_result || tc.status} size="sm" />
                  <Link
                    to={`/test-execution/${session.id}`}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                  >
                    Execute Test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-medium">No test cases generated yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Configure and save environmental parameters above to generate the standardized OIML test plan.
            </p>
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

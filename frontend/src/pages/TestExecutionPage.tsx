import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, Check, X, ChevronRight, FileText, Activity,
  ArrowLeft, ArrowRight, BarChart3, Plus, Scale, AlertTriangle,
  CheckCircle2, Save, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function TestExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);

  // Observation form fields
  const [refLoad, setRefLoad] = useState('');
  const [indicatedVal, setIndicatedVal] = useState('');
  const [pointLabel, setPointLabel] = useState('');
  const [direction, setDirection] = useState('INCREASING');
  const [obsNotes, setObsNotes] = useState('');
  const [recordingObs, setRecordingObs] = useState(false);
  const [obsSuccessMsg, setObsSuccessMsg] = useState<string | null>(null);

  const fetchSessionAndCases = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sessRes, casesRes] = await Promise.all([
        apiClient.get(`/test-sessions/${id}`),
        apiClient.get(`/test-cases/session/${id}`)
      ]);
      setSession(sessRes.data);
      const items = Array.isArray(casesRes.data) ? casesRes.data : [];
      setCases(items);
      if (items.length > 0 && !activeCase) {
        setActiveCase(items[0]);
        fetchObservations(items[0].id);
      } else if (activeCase) {
        const found = items.find(c => c.id === activeCase.id) || items[0];
        setActiveCase(found);
        fetchObservations(found.id);
      }
    } catch (err: any) {
      console.error('Failed to load test execution data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndCases();
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await apiClient.post(`/test-cases/session/${id}/generate`);
      await fetchSessionAndCases();
    } catch (err) {
      console.error('Failed to generate test cases', err);
    } finally {
      setGenerating(false);
    }
  };

  const fetchObservations = async (testCaseId: number) => {
    try {
      const res = await apiClient.get(`/observations/test-case/${testCaseId}`);
      setObservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch observations', err);
    }
  };

  const handleSelectCase = (tc: any) => {
    setActiveCase(tc);
    fetchObservations(tc.id);
  };

  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setRecordingObs(true);
    setObsSuccessMsg(null);
    try {
      const refVal = parseFloat(refLoad);
      const indVal = parseFloat(indicatedVal);

      await apiClient.post('/observations/', {
        test_case_id: activeCase.id,
        reference_value: isNaN(refVal) ? 0.0 : refVal,
        indicated_value: isNaN(indVal) ? 0.0 : indVal,
        test_point_label: pointLabel || `Step ${observations.length + 1}`,
        direction: direction,
        notes: obsNotes || undefined,
        reference_unit: 'kg',
        indicated_unit: 'kg',
        timestamp: new Date().toISOString()
      });

      // Reset form
      setRefLoad('');
      setIndicatedVal('');
      setPointLabel('');
      setObsNotes('');
      setObsSuccessMsg('Observation recorded and evaluated against OIML MPE tolerances!');
      setTimeout(() => setObsSuccessMsg(null), 3500);

      // Refresh observations
      await fetchObservations(activeCase.id);

      // Refresh cases to update status
      const casesRes = await apiClient.get(`/test-cases/session/${id}`);
      const items = Array.isArray(casesRes.data) ? casesRes.data : [];
      setCases(items);
      const updatedCurrent = items.find(c => c.id === activeCase.id);
      if (updatedCurrent) setActiveCase(updatedCurrent);

    } catch (err: any) {
      console.error('Failed to record observation:', err);
      alert(err.response?.data?.detail || 'Failed to record observation');
    } finally {
      setRecordingObs(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!activeCase) return;
    try {
      const res = await apiClient.put(`/test-cases/${activeCase.id}/status`, { status });
      const updated = res.data;
      setCases((prev: any[]) => prev.map(c => c.id === activeCase.id ? { ...c, status: updated.status, overall_result: updated.overall_result } : c));
      setActiveCase((prev: any) => ({ ...prev, status: updated.status, overall_result: updated.overall_result }));
    } catch (err) {
      console.error('Failed to update test case status', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Loading technician execution workspace...</p>
      </div>
    );
  }

  const model = session?.instrument?.model || {};
  const completedCount = cases.filter(c => c.status === 'COMPLETED' || c.status === 'PASS').length;
  const progressPct = cases.length > 0 ? Math.round((completedCount / cases.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate(`/test-plan/${id}`)}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Test Plan
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Play className="h-6 w-6 text-indigo-600" />
              Test Execution Console
            </h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Session {session?.session_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instrument: <span className="font-semibold text-slate-800">{model.model_name || 'Standard Scale'}</span> (SN: {session?.instrument?.serial_number}) • Class {model.accuracy_class || 'III'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/results/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <BarChart3 className="h-4 w-4" /> View Compliance Results <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Visual Workflow Header */}
      <WorkflowStepper
        sessionId={session?.id}
        sessionNumber={session?.session_number}
        currentStep="EXECUTION"
      />

      {/* Execution Progress Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Execution Progression</span>
          <div className="text-base font-bold text-slate-900">
            {completedCount} of {cases.length} Cases Completed ({progressPct}%)
          </div>
        </div>
        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Test Cases Navigation */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Test Cases ({cases.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              {cases.filter(c => c.status === 'PASS' || c.status === 'COMPLETED').length} Done
            </span>
          </div>

          {cases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No test cases generated yet. Click below to initialize.
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-3 block w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {generating ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {cases.map((tc, idx) => {
                const isSelected = activeCase?.id === tc.id;
                const isPass = tc.overall_result === 'PASS' || tc.status === 'PASS';
                const isFail = tc.overall_result === 'FAIL' || tc.status === 'FAIL';

                return (
                  <div
                    key={tc.id}
                    onClick={() => handleSelectCase(tc)}
                    className={`p-3.5 cursor-pointer transition-colors border-l-4 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600'
                        : isPass
                        ? 'border-emerald-500 hover:bg-slate-50'
                        : isFail
                        ? 'border-rose-500 hover:bg-slate-50'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold font-mono text-slate-600 mt-0.5">
                          {tc.sequence_number || idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{tc.test_type || tc.test_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{tc.clause || 'Clause A.4'}</p>
                        </div>
                      </div>
                      <StatusBadge status={tc.overall_result || tc.status || 'PENDING'} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Test Case Workspace & Observations */}
        <div className="lg:col-span-8 space-y-6">
          {activeCase ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
              {/* Active Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      Clause {activeCase.clause || 'OIML R-76 A.4'}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{activeCase.test_type || activeCase.test_name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Sequence #{activeCase.sequence_number || 1} • Accuracy Class {model.accuracy_class || 'III'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Complete Case
                  </button>
                </div>
              </div>

              {/* Procedure Instructions */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-0.5">Statutory Procedure Requirements:</p>
                <p className="leading-relaxed">
                  {activeCase.description || 'Apply standardized reference mass weights in nominal sequence as prescribed by OIML R-76-1. Record reference load (L) and digital scale indication (I).'}
                </p>
              </div>

              {/* Previous Recorded Observations Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-indigo-600" />
                    Recorded Observations ({observations.length})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">Deterministic OIML Evaluation</span>
                </div>

                {observations.length === 0 ? (
                  <div className="p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    No measurement observations logged yet. Enter reference load and indication below.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Point</th>
                          <th className="px-3 py-2.5 text-left font-mono">Reference Load (L)</th>
                          <th className="px-3 py-2.5 text-left font-mono">Indicated Value (I)</th>
                          <th className="px-3 py-2.5 text-left font-mono">Calculated Error</th>
                          <th className="px-3 py-2.5 text-left font-mono">MPE Tolerance</th>
                          <th className="px-3 py-2.5 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {observations.map((obs) => (
                          <tr key={obs.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {obs.test_point_label || `P${obs.sequence_number}`}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                              {obs.reference_value} {obs.reference_unit || 'kg'}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-900">
                              {obs.indicated_value} {obs.indicated_unit || 'kg'}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">
                              {obs.calculated_error != null || obs.corrected_error != null
                                ? `${(obs.corrected_error ?? obs.calculated_error) > 0 ? '+' : ''}${(obs.corrected_error ?? obs.calculated_error).toFixed(4)} kg`
                                : '0.0000 kg'}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600">
                              {obs.permissible_error != null
                                ? `±${obs.permissible_error.toFixed(4)} kg`
                                : '±0.0050 kg'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <StatusBadge status={obs.result || 'PASS'} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Observation Form */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-indigo-600" /> Log Measurement Reading
                  </h4>
                  {obsSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> {obsSuccessMsg}
                    </span>
                  )}
                </div>

                <form onSubmit={handleRecordObservation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Test Point Label
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. 50% Max (Load ${observations.length + 1})`}
                        value={pointLabel}
                        onChange={e => setPointLabel(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-slate-800 font-bold mb-1 text-[11px] uppercase tracking-wider text-indigo-700">
                        REFERENCE LOAD (L) [kg] *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 10.000"
                        value={refLoad}
                        onChange={e => setRefLoad(e.target.value)}
                        className="w-full rounded border border-slate-300 p-2 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label className="block text-slate-800 font-bold mb-1 text-[11px] uppercase tracking-wider text-indigo-700">
                        INDICATED VALUE (I) [kg] *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 10.002"
                        value={indicatedVal}
                        onChange={e => setIndicatedVal(e.target.value)}
                        className="w-full rounded border border-slate-300 p-2 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Loading Direction</label>
                      <select
                        value={direction}
                        onChange={e => setDirection(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="INCREASING">Increasing Load (Ascending)</option>
                        <option value="DECREASING">Decreasing Load (Descending)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Technician Remarks</label>
                      <input
                        type="text"
                        placeholder="Standard center pan loading, zero confirmed..."
                        value={obsNotes}
                        onChange={e => setObsNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={recordingObs}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      {recordingObs ? 'Calculating Error & MPE...' : 'Evaluate & Save Observation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed min-h-[420px] flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Play className="h-10 w-10 mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Select a test case to execute</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a procedure from the left queue to log reference and indicated measurement readings.
              </p>
            </div>
          )}
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

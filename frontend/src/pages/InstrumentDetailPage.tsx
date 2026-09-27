import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Scale, ArrowLeft, Plus, Building2, ShieldCheck,
  Calendar, FileText, CheckCircle2, FlaskConical, ExternalLink,
  ChevronRight, Award, Hash, Info, ShieldAlert
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';

export function InstrumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [instrument, setInstrument] = useState<any>(null);
  const [relatedSessions, setRelatedSessions] = useState<any[]>([]);
  const [relatedReports, setRelatedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.get(`/instruments/${id}`),
      apiClient.get(`/test-sessions/?instrument_id=${id}`).catch(() => ({ data: { items: [] } })),
      apiClient.get('/reports/').catch(() => ({ data: { items: [] } }))
    ])
      .then(([instRes, sessRes, repRes]) => {
        setInstrument(instRes.data);
        const sessions = Array.isArray(sessRes.data?.items) ? sessRes.data.items : (Array.isArray(sessRes.data) ? sessRes.data : []);
        // Filter sessions belonging to this instrument
        const instSessions = sessions.filter((s: any) => String(s.instrument_id) === String(id));
        setRelatedSessions(instSessions.length > 0 ? instSessions : sessions.slice(0, 3));

        const allReports = Array.isArray(repRes.data?.items) ? repRes.data.items : (Array.isArray(repRes.data) ? repRes.data : []);
        // Reports linked to sessions of this instrument
        const linkedReports = allReports.filter((r: any) =>
          instSessions.some((s: any) => s.id === r.session_id)
        );
        setRelatedReports(linkedReports.length > 0 ? linkedReports : allReports.slice(0, 2));
      })
      .catch((err: any) => {
        console.error('Failed to load instrument details:', err);
        setError(err.message || 'Failed to load instrument details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-xs text-slate-500">Loading instrument technical dossier...</p>
      </div>
    );
  }

  if (error || !instrument) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-rose-600 font-semibold mb-4">{error || 'Instrument record not found.'}</p>
          <button
            onClick={() => navigate('/instruments')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Instruments
          </button>
        </div>
      </div>
    );
  }

  const model = instrument.model || {};
  const lab = instrument.laboratory || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/instruments')}
            className="mb-2 flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Instruments
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {model.model_name || 'Standard Industrial Balance'}
            </h1>
            <StatusBadge status={instrument.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Serial Number: <span className="font-bold text-slate-900">{instrument.serial_number}</span> • System ID #{instrument.id}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/test-sessions/new?instrument_id=${instrument.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Start New Test Session
          </button>
        </div>
      </div>

      {/* 1. IDENTITY SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">1. Instrument Identity</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Pattern Approval Registry</span>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Manufacturer</span>
            <span className="font-bold text-slate-900 text-sm">{model.manufacturer_name || 'Generic Metrology'}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Model Designation</span>
            <span className="font-bold text-slate-900 text-sm">{model.model_name || 'N/A'}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Serial Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{instrument.serial_number}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Year of Manufacture</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{instrument.year_of_manufacture || '2023'}</span>
          </div>
        </div>
      </div>

      {/* 2. TECHNICAL SPECIFICATIONS SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">2. Technical Specifications</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">OIML R-76 Class Criteria</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-4">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Accuracy Class</span>
              <span className="text-base font-bold text-indigo-700 font-mono">
                Class {model.accuracy_class || 'III'}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Maximum Capacity (Max)</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {model.max_capacity !== undefined ? `${model.max_capacity} ${model.unit || 'kg'}` : '15.0 kg'}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Scale Interval (e)</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {model.verification_interval_e !== undefined ? `${model.verification_interval_e} ${model.unit || 'kg'}` : '0.005 kg'}
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Actual Interval (d)</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {model.actual_interval_d !== undefined ? `${model.actual_interval_d} ${model.unit || 'kg'}` : '0.001 kg'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block">Verification Scale Intervals (n = Max/e):</span>
              <span className="font-mono font-semibold text-slate-800">
                {model.max_capacity && model.verification_interval_e
                  ? Math.round(model.max_capacity / model.verification_interval_e).toLocaleString()
                  : '3,000'} divisions
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Weighing Receptor Type:</span>
              <span className="font-semibold text-slate-800">Flat Stainless Steel Pan (300 × 240 mm)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Temperature Operating Limits:</span>
              <span className="font-mono font-semibold text-slate-800">-10 °C to +40 °C (Standard Envelope)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LABORATORY SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">3. Accredited Laboratory & Location</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">LABORATORY WORKSPACE</span>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Laboratory Facility</span>
            <span className="font-bold text-slate-900 text-sm">{lab.name || 'Central Metrology Laboratory'}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Laboratory Code</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{lab.code || 'LAB-001'}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-1">Environmental Control</span>
            <span className="font-semibold text-emerald-700">Strict Barometric & Thermal Stabilization</span>
          </div>
        </div>
      </div>

      {/* 4. VERIFICATION SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">4. Verification & Governance Status</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Regulatory Conformance</span>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block mb-1">Active RulePack Reference</span>
            <span className="font-mono font-bold text-indigo-700 text-sm">OIML R-76-1:2006 (v1.0.0)</span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block mb-1">Current Lifecycle Status</span>
            <StatusBadge status={instrument.status} size="sm" />
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-500 block mb-1">Accredited Inspection Cycle</span>
            <span className="font-semibold text-slate-800">Annual Type Re-Verification</span>
          </div>
        </div>
      </div>

      {/* 5. TEST HISTORY SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">5. Test Session History</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
            {relatedSessions.length} recorded
          </span>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {relatedSessions.map(s => (
            <div key={s.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <span className="font-mono font-bold text-slate-900 mr-2 text-sm">{s.session_number}</span>
                <span className="text-slate-400 font-mono">RulePack v{s.rulepack_version || '1.0.0'}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={s.status} size="sm" />
                <Link
                  to={`/test-sessions/${s.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  View Workspace <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {relatedSessions.length === 0 && (
            <div className="p-6 text-center text-slate-400">
              No test sessions executed for this instrument yet.
            </div>
          )}
        </div>
      </div>

      {/* 6. RELATED REPORTS SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">6. Related Standardized Test Reports</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Document Registry</span>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {relatedReports.map(r => (
            <div key={r.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-mono font-bold text-slate-900">{r.report_number}</p>
                  <p className="text-slate-400 text-[11px]">Session ID #{r.session_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} size="sm" />
                <Link
                  to={`/reports/${r.id}`}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  View Dossier
                </Link>
              </div>
            </div>
          ))}
          {relatedReports.length === 0 && (
            <div className="p-6 text-center text-slate-400">
              No reports issued for this instrument yet.
            </div>
          )}
        </div>
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

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, CheckCircle2, ShieldCheck, Code2, GitCompare, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';

interface RuleClause {
  clause: string;
  title: string;
  requirement: string;
  tolerances?: Array<{ range?: string; mpe?: string; parameter?: string; value?: string }>;
}

interface RulePackDetail {
  id: number | string;
  rulePackId: string;
  pack_version: string;
  name: string;
  description: string;
  accuracy_class: string;
  status: string;
  is_demo: boolean;
  standard: string;
  standard_version: string;
  effective_date?: string;
  created_at?: string;
  clauses?: RuleClause[];
  parameters?: any;
  disclaimer: string;
}

export function RulePackPage() {
  const { id } = useParams<{ id: string }>();
  const [pack, setPack] = useState<RulePackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      // Try to fetch rulepack directly
      apiClient.get<RulePackDetail>(`/rulepacks/${id}`)
        .then(res => {
          setPack(res.data);
          setLoading(false);
        })
        .catch(err => {
          // If id was a session ID, try loading session first to get rulepack_version
          apiClient.get(`/test-sessions/${id}`)
            .then(sRes => {
              const version = sRes.data?.rulepack_version || '1.0.0';
              return apiClient.get<RulePackDetail>(`/rulepacks/${version}`);
            })
            .then(res => {
              setPack(res.data);
              setLoading(false);
            })
            .catch(() => {
              setError('RulePack could not be found.');
              setLoading(false);
            });
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm text-slate-500">Loading RulePack specifications...</p>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
          <h2 className="text-lg font-bold">RulePack Not Found</h2>
          <p className="text-sm mt-1">{error || 'The requested RulePack does not exist.'}</p>
          <Link to="/rulepacks" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-800 underline">
            <ArrowLeft className="h-4 w-4" /> Return to RulePacks List
          </Link>
        </div>
      </div>
    );
  }

  const isActive = pack.status === 'APPROVED' || pack.status === 'ACTIVE';

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/rulepacks" className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> RulePacks
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-500 font-mono">v{pack.pack_version}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" /> {pack.name}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Official machine-readable compliance definition for Non-Automatic Weighing Instruments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/change-impact?from_version=1.0.0&to_version=${pack.pack_version}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <GitCompare className="h-4 w-4" /> Simulate Impact
          </Link>
        </div>
      </div>

      {/* Overview Metadata Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Directive Standard</span>
            <span className="font-bold text-slate-900 text-sm">{pack.standard}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Accuracy Class</span>
            <span className="font-bold text-slate-900 text-sm">Class {pack.accuracy_class}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Pack Version</span>
            <span className="font-bold text-slate-900 text-sm font-mono">v{pack.pack_version}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Governance Status</span>
            <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pack.status}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {pack.description}
        </p>
      </div>

      {/* OIML R-76 Clauses & Constraints */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Enforced Clauses & Tolerances</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic criteria evaluated by the MetriSure compliance engine
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
            {pack.clauses?.length || 0} Clauses
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pack.clauses && pack.clauses.map(clause => (
            <div key={clause.clause} className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded text-xs font-bold font-mono border border-indigo-100">
                    Clause {clause.clause}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{clause.title}</h3>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Deterministic Rule
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {clause.requirement}
              </p>

              {clause.tolerances && clause.tolerances.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Tolerances & Criteria:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {clause.tolerances.map((tol, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                        {tol.range && <div className="text-slate-500 font-mono">{tol.range}</div>}
                        {tol.mpe && <div className="font-bold text-indigo-600 font-mono mt-0.5">MPE: {tol.mpe}</div>}
                        {tol.parameter && <div className="text-slate-500">{tol.parameter}</div>}
                        {tol.value && <div className="font-bold text-slate-800 font-mono mt-0.5">{tol.value}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Parameters */}
      {pack.parameters?.environmental_envelope && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 text-base mb-1">Environmental Envelope Parameters</h2>
          <p className="text-xs text-slate-500 mb-4">Specified operating conditions for test validity</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block">Min Temperature</span>
              <span className="text-lg font-bold text-slate-800 font-mono">
                {pack.parameters.environmental_envelope.temperature_min_c} °C
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block">Max Temperature</span>
              <span className="text-lg font-bold text-slate-800 font-mono">
                {pack.parameters.environmental_envelope.temperature_max_c} °C
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block">Max Relative Humidity</span>
              <span className="text-lg font-bold text-slate-800 font-mono">
                {pack.parameters.environmental_envelope.humidity_max_percent} %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Parameters Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Machine-Readable RulePack JSON</h3>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            {showRawJson ? 'Hide JSON' : 'Show Raw JSON Payload'}
          </button>
        </div>

        {showRawJson && (
          <pre className="mt-4 bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96">
            {JSON.stringify(pack, null, 2)}
          </pre>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center space-y-1">
        <p className="text-sm font-bold text-amber-800">
          DEMO RULEPACK — NOT AUTHORITATIVE
        </p>
        <p className="text-xs text-amber-700">
          DEMO DATA — FOR DEMONSTRATION ONLY. The tolerances and thresholds provided correspond to illustrative interpretations of OIML Recommendation R 76-1.
        </p>
      </div>
    </div>
  );
}
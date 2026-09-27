import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileCode, CheckCircle2, AlertTriangle, ArrowRight, GitCompare, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';

interface RulePackItem {
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
  clauses?: Array<{ clause: string; title: string; requirement: string }>;
  parameters?: any;
  disclaimer: string;
}

export function RulePacksPage() {
  const [rulepacks, setRulepacks] = useState<RulePackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRulePacks = () => {
    setLoading(true);
    apiClient.get<{ items: RulePackItem[]; total: number }>('/rulepacks/')
      .then(res => {
        setRulepacks(res.data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load RulePacks:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRulePacks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" /> Digital RulePacks
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Machine-readable regulatory interpretations of NAWI directive OIML R-76-1:2006.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/change-impact"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <GitCompare className="h-4 w-4 text-indigo-600" /> Change Impact Analysis
          </Link>
          <button
            onClick={fetchRulePacks}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh RulePacks"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* RulePack Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
          <p className="text-sm">Loading registered RulePacks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rulepacks.map(pack => {
            const isActive = pack.status === 'APPROVED' || pack.status === 'ACTIVE';
            return (
              <div
                key={pack.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col justify-between transition-all ${
                  isActive ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <FileCode className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{pack.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          v{pack.pack_version} • Standard: {pack.standard}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {pack.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                    {pack.description}
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 mb-5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Accuracy Class:</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        Class {pack.accuracy_class}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Clauses Enforced:</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        {pack.clauses ? pack.clauses.length : 5} OIML Clauses
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Effective Date:</span>
                      <span className="font-mono text-slate-600">{pack.effective_date || '2026-09-01'}</span>
                    </div>
                  </div>

                  {pack.clauses && (
                    <ul className="space-y-1.5 mb-2 text-xs text-slate-600">
                      {pack.clauses.slice(0, 3).map(c => (
                        <li key={c.clause} className="flex items-center gap-2">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="font-mono font-medium">{c.clause}:</span>
                          <span className="truncate">{c.title}</span>
                        </li>
                      ))}
                      {pack.clauses.length > 3 && (
                        <li className="text-[11px] text-slate-400 pl-5">
                          + {pack.clauses.length - 3} additional clauses...
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-3">
                  <Link
                    to={`/rulepacks/${pack.id}`}
                    className={`flex-1 py-2 text-center rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    View Constraints & Clauses
                  </Link>
                  <Link
                    to={`/change-impact?from_version=1.0.0&to_version=${pack.pack_version}`}
                    className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1"
                    title="Simulate impact against historical sessions"
                  >
                    <GitCompare className="h-3.5 w-3.5" /> Diff
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimers */}
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

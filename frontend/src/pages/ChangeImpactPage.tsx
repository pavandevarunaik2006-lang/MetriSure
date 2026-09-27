import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, BookOpen, ExternalLink, ShieldAlert } from 'lucide-react';
import { apiClient } from '../api/client';

interface AffectedSession {
  session_id: number;
  session_number: string;
  instrument_id?: number;
  from_result: string;
  to_result: string;
  reason?: string;
}

interface ChangeImpactResponse {
  from_version: string;
  to_version: string;
  total_sessions: number;
  unchanged: number;
  affected: AffectedSession[];
  match_rate: number;
  disclaimer: string;
}

interface RulePackSimple {
  id: number | string;
  pack_version: string;
  name: string;
  status: string;
}

export function ChangeImpactPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFrom = searchParams.get('from_version') || '1.0.0';
  const initialTo = searchParams.get('to_version') || '1.0.1-rc1';

  const [fromVersion, setFromVersion] = useState(initialFrom);
  const [toVersion, setToVersion] = useState(initialTo);
  const [versions, setVersions] = useState<RulePackSimple[]>([]);
  const [impactData, setImpactData] = useState<ChangeImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Load RulePack list for dropdowns
  useEffect(() => {
    apiClient.get<{ items: RulePackSimple[] }>('/rulepacks/')
      .then(res => {
        if (res.data.items && res.data.items.length > 0) {
          setVersions(res.data.items);
        } else {
          setVersions([
            { id: 1, pack_version: '1.0.0', name: 'DEMO RULEPACK — Class III NAWI', status: 'APPROVED' },
            { id: 2, pack_version: '1.0.1-rc1', name: 'DEMO RULEPACK — Class III NAWI (Candidate)', status: 'DRAFT' }
          ]);
        }
      })
      .catch(() => {
        setVersions([
          { id: 1, pack_version: '1.0.0', name: 'DEMO RULEPACK — Class III NAWI', status: 'APPROVED' },
          { id: 2, pack_version: '1.0.1-rc1', name: 'DEMO RULEPACK — Class III NAWI (Candidate)', status: 'DRAFT' }
        ]);
      });
  }, []);

  const runSimulation = (from: string, to: string) => {
    setLoading(true);
    apiClient.get<ChangeImpactResponse>(`/rulepacks/change-impact?from_version=${from}&to_version=${to}`)
      .then(res => {
        setImpactData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Change impact calculation failed:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    runSimulation(fromVersion, toVersion);
  }, [fromVersion, toVersion]);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ from_version: fromVersion, to_version: toVersion });
    runSimulation(fromVersion, toVersion);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-indigo-600" /> Change Impact Analysis
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Simulate the retrospective compliance impact of regulatory RulePack revisions across historical sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/rulepacks"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-slate-500" /> View RulePacks
          </Link>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <form onSubmit={handleSimulate} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Simulation Parameters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Baseline RulePack (Source)
            </label>
            <select
              value={fromVersion}
              onChange={e => setFromVersion(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {versions.map(v => (
                <option key={`from-${v.pack_version}`} value={v.pack_version}>
                  v{v.pack_version} — {v.name} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-center pb-2">
            <div className="flex items-center gap-1 text-slate-400 font-semibold text-xs bg-slate-100 px-3 py-1.5 rounded-full">
              <ArrowRight className="h-4 w-4" /> Compare
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Candidate RulePack (Target)
            </label>
            <select
              value={toVersion}
              onChange={e => setToVersion(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {versions.map(v => (
                <option key={`to-${v.pack_version}`} value={v.pack_version}>
                  v{v.pack_version} — {v.name} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Simulation Results Section */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-sm">Evaluating historical test observations under candidate RulePack...</p>
        </div>
      ) : impactData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Parity / Match Rate</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${
                  impactData.match_rate >= 90 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {impactData.match_rate}%
                </span>
                <span className="text-xs text-slate-400">consistency</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Sessions Evaluated</span>
              <div className="text-3xl font-black text-slate-900">
                {impactData.total_sessions}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Unchanged Outcome</span>
              <div className="text-3xl font-black text-slate-700">
                {impactData.unchanged}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Outcome Variances</span>
              <div className={`text-3xl font-black ${impactData.affected.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {impactData.affected.length}
              </div>
            </div>
          </div>

          {/* Variance Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Outcome Variance Matrix</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical sessions whose compliance verdict would differ under RulePack v{impactData.to_version}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                impactData.affected.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {impactData.affected.length} affected
              </span>
            </div>

            {impactData.affected.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {impactData.affected.map(item => (
                  <div key={item.session_id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/test-sessions/${item.session_id}`}
                          className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-mono"
                        >
                          Session {item.session_number} <ExternalLink className="h-3 w-3" />
                        </Link>
                        {item.instrument_id && (
                          <span className="text-xs text-slate-500 font-mono">
                            Instrument #{item.instrument_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {item.reason || 'Variance detected under candidate verification criteria.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded font-mono ${
                        item.from_result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.from_result} (v{impactData.from_version})
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className={`px-2.5 py-1 text-xs font-bold rounded font-mono ${
                        item.to_result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.to_result} (v{impactData.to_version})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h3 className="text-base font-bold text-slate-800">100% Outcome Parity</h3>
                <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
                  All {impactData.total_sessions} historical sessions maintain identical compliance verdicts under RulePack v{impactData.to_version}. No regressions detected.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prominent Mandatory Disclaimers */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center space-y-1">
        <p className="text-sm font-bold text-amber-800 flex items-center justify-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          SIMULATION — NOT AN OFFICIAL RESULT. DEMO RULEPACK — NOT AUTHORITATIVE
        </p>
        <p className="text-xs text-amber-700">
          DEMO DATA — FOR DEMONSTRATION ONLY. Retrospective change impact simulation is strictly advisory and does not mutate or invalidate officially approved calibration records.
        </p>
      </div>
    </div>
  );
}
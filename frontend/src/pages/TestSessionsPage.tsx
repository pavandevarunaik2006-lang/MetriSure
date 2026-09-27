import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FlaskConical, Plus, Search, Filter, RefreshCw, ChevronRight,
  Calendar, Scale, Building2, User, Thermometer
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';

export function TestSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchSessions = () => {
    setLoading(true);
    apiClient.get('/test-sessions/')
      .then(res => {
        const items = Array.isArray(res.data?.items) ? res.data.items : (Array.isArray(res.data) ? res.data : []);
        setSessions(items);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load test sessions:', err);
        setError(err.message || 'Failed to load test sessions');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = (sessions || []).filter((session) => {
    if (!session) return false;
    if (statusFilter !== 'ALL' && session.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const sessionNum = (session.session_number || `TS-${session.id}`).toLowerCase();
      const modelName = (session.instrument?.model?.model_name || '').toLowerCase();
      const sn = (session.instrument?.serial_number || '').toLowerCase();
      const lab = (session.laboratory?.name || '').toLowerCase();
      return sessionNum.includes(term) || modelName.includes(term) || sn.includes(term) || lab.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              NAWI Test Execution Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Pattern Evaluation & Calibration Sessions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-indigo-600" />
            Test Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor, plan, execute, and verify compliance test sessions for weighing instruments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/test-sessions/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Test Session
          </button>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh session list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by session #, serial #, or instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Filter by Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses ({sessions.length})</option>
              <option value="DRAFT">DRAFT</option>
              <option value="READY">READY</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            {(statusFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Sessions Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-xs">Loading test sessions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Session Number</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Instrument Under Test</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">RulePack</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Environment</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Laboratory</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => navigate(`/test-sessions/${session.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                        {session.session_number}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Session ID #{session.id}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {session.instrument?.model?.model_name || 'Standard Balance'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        SN: {session.instrument?.serial_number || `INST-${session.instrument_id}`}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-700">
                      v{session.rulepack_version || '1.0.0'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {session.env_temperature !== null && session.env_temperature !== undefined ? (
                        <div className="flex items-center gap-1 font-mono">
                          <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                          <span>{session.env_temperature} °C</span>
                          <span className="text-slate-300">/</span>
                          <span>{session.env_humidity || 45}% RH</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending setup</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{session.laboratory?.name || 'Metrology Lab #1'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={session.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium">
                      <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800">
                        Workspace <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            <FlaskConical className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No test sessions match your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or keyword.</p>
          </div>
        )}

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredSessions.length} of {sessions.length} sessions</span>
          <span className="font-mono text-[11px]">NAWI Pattern Approval Lifecycle</span>
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

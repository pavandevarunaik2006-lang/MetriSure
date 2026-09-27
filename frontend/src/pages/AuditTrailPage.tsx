import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScrollText, Search, Filter, ShieldCheck, Clock, User, Eye, X, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface AuditLogItem {
  id: number;
  timestamp: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  ip_address?: string;
}

export function AuditTrailPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMyEventsParam = searchParams.get('filter') === 'me';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userScope, setUserScope] = useState<'ALL' | 'ME'>(isMyEventsParam ? 'ME' : 'ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Sync state if URL query param changes
  useEffect(() => {
    if (searchParams.get('filter') === 'me') {
      setUserScope('ME');
    }
  }, [searchParams]);

  const fetchLogs = () => {
    setLoading(true);
    apiClient.get<{ items: AuditLogItem[]; total: number }>('/audit/')
      .then(res => {
        setLogs(res.data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter by My Events
      if (userScope === 'ME' && user?.email) {
        if (log.user_email?.toLowerCase() !== user.email.toLowerCase()) {
          return false;
        }
      }
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (roleFilter !== 'ALL' && log.user_role !== roleFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesEmail = log.user_email?.toLowerCase().includes(term);
        const matchesAction = log.action?.toLowerCase().includes(term);
        const matchesEntity = log.entity_type?.toLowerCase().includes(term) || log.entity_id?.toLowerCase().includes(term);
        const matchesDetails = typeof log.details === 'string'
          ? log.details.toLowerCase().includes(term)
          : JSON.stringify(log.details || {}).toLowerCase().includes(term);
        return matchesEmail || matchesAction || matchesEntity || matchesDetails;
      }
      return true;
    });
  }, [logs, userScope, user?.email, actionFilter, roleFilter, searchTerm]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVE')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('REJECT') || action.includes('FAIL')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (action.includes('CREATE') || action.includes('SEED')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (action.includes('FLAG') || action.includes('OVERRIDE')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'APPROVER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REVIEWER': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'TECHNICIAN': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-indigo-600" />
            {userScope === 'ME' ? 'My Audit Events' : 'Immutable Audit Trail'}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            {userScope === 'ME'
              ? `Cryptographic record of actions performed by ${user?.full_name || 'your account'} (${user?.email}).`
              : 'Complete cryptographic and role-gated log of all metrological system events, session edits, and approvals.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scope Banner if filtered to current user */}
      {userScope === 'ME' && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-indigo-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-indigo-950">
                Active Filter: <span className="font-bold">{user?.full_name}</span> ({user?.email})
              </p>
              <p className="text-indigo-700 text-[11px]">
                Displaying only audit events initiated by your account ({user?.role}).
              </p>
            </div>
          </div>
          {user?.role === 'ADMINISTRATOR' && (
            <button
              onClick={() => {
                setUserScope('ALL');
                setSearchParams({});
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/50 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Show All System Events &rarr;
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search actor, action, entity..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* User Scope Dropdown */}
            {user?.role === 'ADMINISTRATOR' && (
              <select
                value={userScope}
                onChange={e => {
                  const scope = e.target.value as 'ALL' | 'ME';
                  setUserScope(scope);
                  if (scope === 'ME') {
                    setSearchParams({ filter: 'me' });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="text-xs font-semibold border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-indigo-50/60 text-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All System Actors</option>
                <option value="ME">My Events ({user?.email})</option>
              </select>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </div>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Actions ({actionList.length})</option>
              {actionList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Role Filter */}
            {userScope !== 'ME' && (
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="APPROVER">Approver</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            )}

            {(actionFilter !== 'ALL' || roleFilter !== 'ALL' || searchTerm || userScope === 'ME') && (
              <button
                onClick={() => {
                  setActionFilter('ALL');
                  setRoleFilter('ALL');
                  setSearchTerm('');
                  setUserScope('ALL');
                  setSearchParams({});
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-sm">Retrieving audit log entries...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-xs">{log.user_email || 'System'}</span>
                        {log.user_role && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(log.user_role)}`}>
                            {log.user_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {typeof log.details === 'object' && log.details !== null
                        ? (log.details.message || log.details.notes || JSON.stringify(log.details))
                        : (log.details || '—')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            <ScrollText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No audit events match your search criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting your filters or modifying the search keyword.</p>
          </div>
        )}

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredLogs.length} of {logs.length} logged events</span>
          <span className="font-mono text-[11px]">Tamper-Evident SHA-256 Storage</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Audit Event #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Timestamp</label>
                  <p className="font-mono text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedLog.timestamp}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Source IP Address</label>
                  <p className="font-mono text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedLog.ip_address}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Actor (Email)</label>
                  <p className="font-mono text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 truncate">
                    {selectedLog.user_email || 'SYSTEM'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Role</label>
                  <p className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 font-bold">
                    {selectedLog.user_role || 'SYSTEM'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Action Type</label>
                  <p className="font-bold text-indigo-700 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                    {selectedLog.action}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">Target Resource</label>
                  <p className="font-mono text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedLog.entity_type} {selectedLog.entity_id ? `(#${selectedLog.entity_id})` : ''}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block font-medium mb-1">Event Payload & Context</label>
                <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-3.5 rounded-lg overflow-x-auto max-h-48 border border-slate-800">
                  {typeof selectedLog.details === 'object'
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : (selectedLog.details || 'No additional payload.')}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                <span className="font-bold">Cryptographic Ledger Integrity:</span> This record is immutably stamped and cannot be modified or purged by any system operator.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

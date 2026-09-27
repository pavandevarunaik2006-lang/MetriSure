import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, CheckCircle, Search, Filter, 
  ArrowRight, FileCheck, XCircle, AlertTriangle,
  RefreshCw, ClipboardCheck, Clock, Stamp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ReviewWorkspacePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchQueue = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('/review/queue');
      const items = res.data.items || res.data || [];
      setSessions(items);
    } catch (err: any) {
      console.error('Failed to load review queue:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter !== 'ALL' && s.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numMatch = s.session_number?.toLowerCase().includes(term);
      const serialMatch = s.instrument?.serial_number?.toLowerCase().includes(term);
      const modelMatch = s.instrument?.model?.model_name?.toLowerCase().includes(term);
      return numMatch || serialMatch || modelMatch;
    }
    return true;
  });

  const pendingReviewCount = sessions.filter(s => ['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED'].includes(s.status)).length;
  const pendingApprovalCount = sessions.filter(s => s.status === 'REVIEWED').length;
  const approvedCount = sessions.filter(s => s.status === 'APPROVED').length;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ClipboardCheck className="h-7 w-7 text-blue-600" />
            Review & Approval Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === 'REVIEWER' 
              ? 'Verify test sessions, optical evidence, and compliance traces before approval.' 
              : user?.role === 'APPROVER' 
              ? 'Final approval sign-off gate for standardized report issuance.' 
              : 'Metrological review queue for verification and quality control.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchQueue}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingReviewCount}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Awaiting Peer Review</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-indigo-600">{pendingApprovalCount}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Awaiting Approver Sign-Off</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Stamp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Approved for Report Issuance</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search session #, serial, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-none py-1.5 pl-9 pr-3 text-xs focus:ring-0 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 py-1.5 px-3 text-xs font-medium text-slate-700 outline-none bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses ({sessions.length})</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="COMPLETED">Completed</option>
            <option value="REVIEWED">Reviewed (Ready for Approval)</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Sessions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-medium">Loading Review Workspace...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No sessions match current criteria</h3>
            <p className="mt-1 text-xs text-slate-500">There are no test sessions awaiting review or matching your filter.</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const instrument = session.instrument;
            const model = instrument?.model;
            const isReviewed = session.status === 'REVIEWED';
            const isApproved = session.status === 'APPROVED';

            return (
              <div 
                key={session.id} 
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col sm:flex-row transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="p-5 flex-1 flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isApproved ? 'bg-emerald-50 text-emerald-600' :
                    isReviewed ? 'bg-indigo-50 text-indigo-600' :
                    session.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {isApproved ? <Stamp className="h-5 w-5" /> :
                     isReviewed ? <CheckCircle className="h-5 w-5" /> :
                     session.status === 'REJECTED' ? <XCircle className="h-5 w-5" /> :
                     <FileCheck className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{session.session_number}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' :
                        isReviewed ? 'bg-indigo-100 text-indigo-800' :
                        session.status === 'CHANGES_REQUESTED' ? 'bg-amber-100 text-amber-800' :
                        session.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      {model?.model_name || 'Generic Scale'} {instrument ? `(SN: ${instrument.serial_number})` : ''}
                      {model?.accuracy_class ? ` • Class ${model.accuracy_class}` : ''}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Laboratory: <span className="font-medium text-slate-700">{session.laboratory?.name || 'National Metrology Lab'}</span>
                      {session.created_at ? ` • Created: ${new Date(session.created_at).toLocaleDateString()}` : ''}
                      {session.rulepack_version ? ` • RulePack v${session.rulepack_version}` : ''}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-100 p-4 sm:p-5 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:w-48">
                  <div className="text-left sm:text-right w-full">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Gate</span>
                    <span className="text-xs font-bold text-slate-800">
                      {isApproved ? 'REPORT ISSUED' : isReviewed ? 'READY FOR APPROVER' : 'REQUIRES REVIEW'}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/review/${session.id}`)}
                    className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors w-full"
                  >
                    <span>{isReviewed ? 'Inspect & Approve' : 'Inspect & Review'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Demo Disclaimer */}
      <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
        <p className="text-xs text-amber-800 font-semibold tracking-wide">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}

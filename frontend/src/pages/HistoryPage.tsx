import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { 
  History as HistoryIcon, Search, Scale, ShieldCheck, 
  Activity, FileText, RefreshCw, Clock, Database, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HistoryEvent {
  id: string;
  date: string;
  timestamp: string;
  event: string;
  details: string;
  category: 'REGISTRATION' | 'SESSION' | 'AUDIT' | 'REPORT';
  instrumentTitle: string;
  serialNumber: string;
  link?: string;
}

export function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [instRes, sessRes, repRes, auditRes] = await Promise.allSettled([
        apiClient.get('/instruments/'),
        apiClient.get('/test-sessions/'),
        apiClient.get('/reports/'),
        apiClient.get('/audit/'),
      ]);

      const items: HistoryEvent[] = [];

      // 1. Instruments Registered
      if (instRes.status === 'fulfilled') {
        const insts = instRes.value.data.items || instRes.value.data || [];
        insts.forEach((inst: any) => {
          items.push({
            id: `inst-${inst.id}`,
            date: new Date(inst.created_at || Date.now()).toLocaleDateString(),
            timestamp: inst.created_at || new Date().toISOString(),
            event: 'Instrument Registered in Registry',
            details: `Model: ${inst.model?.model_name || 'Generic NAWI'} • Class: ${inst.accuracy_class || 'III'} • Max: ${inst.max_capacity} kg`,
            category: 'REGISTRATION',
            instrumentTitle: inst.model?.model_name || 'NAWI Instrument',
            serialNumber: inst.serial_number || 'N/A',
            link: `/instruments/${inst.id}`,
          });
        });
      }

      // 2. Test Sessions Executed
      if (sessRes.status === 'fulfilled') {
        const sessions = sessRes.value.data.items || sessRes.value.data || [];
        sessions.forEach((s: any) => {
          items.push({
            id: `sess-${s.id}`,
            date: new Date(s.created_at || Date.now()).toLocaleDateString(),
            timestamp: s.created_at || new Date().toISOString(),
            event: `Test Session ${s.status}`,
            details: `Session ${s.session_number} • Temp: ${s.env_temperature ?? 'N/A'} °C • Status: ${s.status}`,
            category: 'SESSION',
            instrumentTitle: s.instrument?.model?.model_name || `Instrument #${s.instrument_id}`,
            serialNumber: s.instrument?.serial_number || 'N/A',
            link: `/test-sessions/${s.id}`,
          });
        });
      }

      // 3. Reports Issued
      if (repRes.status === 'fulfilled') {
        const reports = repRes.value.data.items || repRes.value.data || [];
        reports.forEach((rep: any) => {
          items.push({
            id: `rep-${rep.id}`,
            date: new Date(rep.issue_date || rep.created_at || Date.now()).toLocaleDateString(),
            timestamp: rep.issue_date || rep.created_at || new Date().toISOString(),
            event: `Standardized Test Report Issued (${rep.report_number})`,
            details: `Evaluation Result: ${rep.result || 'PASS'} • Version: ${rep.version || 1} • Status: ${rep.status}`,
            category: 'REPORT',
            instrumentTitle: rep.instrument?.model_name || 'NAWI Instrument',
            serialNumber: rep.instrument?.serial_number || 'N/A',
            link: `/reports/${rep.id}`,
          });
        });
      }

      // 4. Key Governance Audits
      if (auditRes.status === 'fulfilled') {
        const logs = auditRes.value.data?.items || [];
        logs.slice(0, 15).forEach((log: any) => {
          items.push({
            id: `audit-${log.id}`,
            date: new Date(log.timestamp).toLocaleDateString(),
            timestamp: log.timestamp,
            event: `Audit: ${log.action} on ${log.entity_type} #${log.entity_id}`,
            details: `User: ${log.user_email || 'System'} (${log.user_role || 'SYSTEM'})`,
            category: 'AUDIT',
            instrumentTitle: `${log.entity_type} #${log.entity_id}`,
            serialNumber: log.user_role || 'SYSTEM',
          });
        });
      }

      // Sort chronological descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(items);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to query historical timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredEvents = events.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.event.toLowerCase().includes(term) ||
      e.instrumentTitle.toLowerCase().includes(term) ||
      e.serialNumber.toLowerCase().includes(term) ||
      e.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <HistoryIcon className="h-7 w-7 text-blue-600" />
            Registry Lifecycle History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chronological audit trail of instrument registrations, test sessions, and issued reports.
          </p>
        </div>

        <button 
          onClick={fetchHistory}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Timeline
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by event, instrument, serial number, or session..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border-none py-1.5 pl-9 pr-3 text-xs focus:ring-0 outline-none"
        />
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-6">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 ml-6">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
            Loading Registry History...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="ml-6 p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            No historical records found matching current query.
          </div>
        ) : (
          filteredEvents.map((item) => (
            <div key={item.id} className="relative pl-7">
              <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                item.category === 'REPORT' ? 'bg-purple-600' :
                item.category === 'SESSION' ? 'bg-blue-600' :
                item.category === 'REGISTRATION' ? 'bg-emerald-600' :
                'bg-slate-400'
              }`} />

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {item.event}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                    {item.category === 'REPORT' ? <FileText className="h-4 w-4 text-purple-600" /> :
                     item.category === 'SESSION' ? <Activity className="h-4 w-4 text-blue-600" /> :
                     item.category === 'REGISTRATION' ? <Scale className="h-4 w-4 text-emerald-600" /> :
                     <Database className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.instrumentTitle} {item.serialNumber ? `(SN: ${item.serialNumber})` : ''}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{item.details}</p>
                  </div>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                    >
                      View &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Demo Notice */}
      <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
        <p className="text-xs text-amber-800 font-semibold tracking-wide">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}

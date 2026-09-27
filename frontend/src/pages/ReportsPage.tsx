import React, { useState, useEffect } from 'react';
import { apiClient, getApiUrl } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Search, Filter, Download, ArrowRight, 
  ShieldCheck, Clock, Plus, RefreshCw, QrCode, CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [eligibleSessions, setEligibleSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [repRes, sessRes] = await Promise.all([
        apiClient.get('/reports/'),
        apiClient.get('/test-sessions/')
      ]);
      const repItems = repRes.data.items || repRes.data || [];
      setReports(repItems);

      const sessItems = sessRes.data.items || sessRes.data || [];
      // Eligible sessions: APPROVED or COMPLETED
      const reportedSessionIds = new Set(repItems.map((r: any) => String(r.session_id)));
      const unissued = sessItems.filter((s: any) => 
        ['APPROVED', 'COMPLETED'].includes(s.status) && !reportedSessionIds.has(String(s.id))
      );
      setEligibleSessions(unissued);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to load report registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async (sessionId: number) => {
    setGenLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post(`/reports/generate/${sessionId}`);
      setSuccessMsg(`Standardized Test Report generated: ${res.data.report_number}`);
      await fetchData();
    } catch (err: any) {
      console.error('Report generation error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate report.');
    } finally {
      setGenLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numMatch = r.report_number?.toLowerCase().includes(term);
      const sessMatch = r.session_number?.toLowerCase().includes(term);
      const instMatch = r.instrument?.model_name?.toLowerCase().includes(term) || r.instrument?.serial_number?.toLowerCase().includes(term);
      return numMatch || sessMatch || instMatch;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-blue-600" />
            Standardized Test Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate, inspect, and export formal OIML R-76 test evaluation reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/repository"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Repository &rarr;
          </Link>
          <Link
            to="/verification"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Verification &rarr;
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Eligible Sessions Ready for Generation */}
      {eligibleSessions.length > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Sessions Ready for Report Issuance ({eligibleSessions.length})
            </h3>
            <span className="text-[10px] text-blue-700 font-medium">Compliance evaluation complete</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {eligibleSessions.map((sess) => (
              <div key={sess.id} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm flex flex-col justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{sess.session_number}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Status: <strong className="text-slate-700">{sess.status}</strong></div>
                </div>
                <button
                  onClick={() => handleGenerateReport(sess.id)}
                  disabled={genLoading}
                  className="w-full inline-flex justify-center items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <FileText className="h-3 w-3" />
                  {genLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search report #, session, or instrument..."
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
            <option value="ALL">All Reports ({reports.length})</option>
            <option value="ISSUED">Issued</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5 text-left">Report Number</th>
                <th className="px-5 py-3.5 text-left">Test Session</th>
                <th className="px-5 py-3.5 text-left">Instrument</th>
                <th className="px-5 py-3.5 text-left">Date Issued</th>
                <th className="px-5 py-3.5 text-center">Result</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                    Loading Reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No reports match current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                      {report.report_number}
                      <span className="block text-[10px] text-slate-400 font-mono">ID #{report.id} • v{report.version || 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link 
                        to={`/test-sessions/${report.session_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {report.session_number || `Session #${report.session_id}`}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{report.instrument?.model_name || 'Generic NAWI'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{report.instrument?.serial_number ? `SN: ${report.instrument.serial_number}` : ''}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono">
                      {new Date(report.issue_date || report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        report.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                        report.result === 'FAIL' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {report.result || 'PASS'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="h-3 w-3" />
                        {report.status || 'ISSUED'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getApiUrl(`/api/reports/${report.id}/pdf`)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <a
                          href={getApiUrl(`/api/reports/${report.id}/docx`)}
                          download={`${report.report_number}.docx`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Download Editable Word Report (DOCX)"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                        <Link
                          to={`/verification/${report.id}`}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          title="Verify Cryptographic Hash"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors"
                        >
                          <span>View</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

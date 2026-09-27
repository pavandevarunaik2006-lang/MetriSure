import React, { useState, useEffect } from 'react';
import { apiClient, getApiUrl } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Archive, FileText, Search, Filter, Download, ArrowRight, 
  ShieldCheck, Clock, RefreshCw, QrCode, ExternalLink,
  Layers, Scale, Database
} from 'lucide-react';

export function ReportRepositoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('/reports/');
      const items = res.data.items || res.data || [];
      setReports(items);
    } catch (err: any) {
      console.error('Failed to load reports from repository:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to query report repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numMatch = r.report_number?.toLowerCase().includes(term);
      const sessMatch = r.session_number?.toLowerCase().includes(term);
      const serialMatch = r.instrument?.serial_number?.toLowerCase().includes(term);
      const modelMatch = r.instrument?.model_name?.toLowerCase().includes(term);
      return numMatch || sessMatch || serialMatch || modelMatch;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Archive className="h-7 w-7 text-indigo-600" />
            Metrological Report Repository
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Archival document retrieval and cryptographic registry of issued NAWI test reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchReports}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/reports"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Report Generator &rarr;
          </Link>
          <Link
            to="/verification"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Public Verification &rarr;
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Archived Reports</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              {reports.filter(r => r.status === 'ISSUED' || r.status === 'APPROVED').length}
            </p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Issued & Validated</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.result === 'PASS').length}
            </p>
            <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Pattern Approved</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search report #, serial, or session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-none py-1.5 pl-9 pr-3 text-xs focus:ring-0 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 py-1.5 px-3 text-xs font-medium text-slate-700 outline-none bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Issued</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Repository Archive Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5 text-left">Document ID</th>
                <th className="px-5 py-3.5 text-left">Instrument & Serial</th>
                <th className="px-5 py-3.5 text-left">Linked Session</th>
                <th className="px-5 py-3.5 text-left">Issue Date</th>
                <th className="px-5 py-3.5 text-center">Result</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    Querying Repository...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Archive className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No documents found in repository.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono">
                      <span className="font-bold text-slate-900 block">{report.report_number}</span>
                      <span className="text-[10px] text-slate-400">ID #{report.id} • v{report.version || 1}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{report.instrument?.model_name || 'Generic NAWI'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {report.instrument?.serial_number ? `SN: ${report.instrument.serial_number}` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/test-sessions/${report.session_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {report.session_number || `Session #${report.session_id}`}
                      </Link>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                          title="Download PDF Document"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Link
                          to={`/verification/${report.id}`}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          title="Verify Digital Digest"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors"
                        >
                          <span>Open</span>
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

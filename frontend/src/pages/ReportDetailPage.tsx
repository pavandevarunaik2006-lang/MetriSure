import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileText, Printer, ShieldCheck, 
  RefreshCw, QrCode, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { apiClient, getApiUrl } from '../api/client';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    apiClient.get(`/reports/${id}`)
      .then(async (res) => {
        const rep = res.data;
        setReport(rep);
        if (rep.session_id) {
          try {
            const [sessRes, tcRes] = await Promise.allSettled([
              apiClient.get(`/test-sessions/${rep.session_id}`),
              apiClient.get(`/test-cases/session/${rep.session_id}`)
            ]);
            if (sessRes.status === 'fulfilled') setSession(sessRes.value.data);
            if (tcRes.status === 'fulfilled') setTestCases(tcRes.value.data || []);
          } catch (e) {
            console.error('Error fetching session details:', e);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load report:', err);
        setErrorMsg(err.response?.data?.detail || 'Report not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading Report Details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
        <p className="text-slate-600 mb-6">Could not load details for report ID {id}.</p>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const isPass = report.result === 'PASS' || session?.status === 'COMPLETED' || session?.status === 'APPROVED';
  const instrument = report.instrument;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Workflow Stepper */}
      {session && (
        <WorkflowStepper sessionId={session.id} sessionNumber={session.session_number} currentStep="REPORT" />
      )}

      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate('/reports')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Reports
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print
          </button>
          <Link
            to={`/verification/${report.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
            Verify
          </Link>
          <a
            href={getApiUrl(`/api/reports/${report.id}/docx`)}
            download={`${report.report_number}.docx`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            Download Word (DOCX)
          </a>
          <a
            href={getApiUrl(`/api/reports/${report.id}/pdf`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </a>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* The Report Document Container */}
      <div className="rounded-2xl bg-white p-8 sm:p-10 shadow-lg border border-slate-200 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                Standardized Test Report
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                OIML R-76 Non-Automatic Weighing Instruments (NAWI)
              </p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  DEMO RULEPACK — NOT AUTHORITATIVE
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Report Number</span>
            <span className="text-lg font-mono font-bold text-slate-900 block">{report.report_number}</span>
            <span className="text-xs text-slate-500 font-mono">v{report.version || 1} • {new Date(report.issue_date || report.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Section 1: Overview Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
              Evaluation & Session Context
            </h2>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Issuing Facility:</span><span className="font-semibold text-slate-900">National Metrology Laboratory</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Session Number:</span><span className="font-mono font-semibold text-slate-900">{report.session_number || `Session #${report.session_id}`}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Session Status:</span><span className="font-semibold text-slate-900">{session?.status || report.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Evaluation Date:</span><span className="font-semibold text-slate-900">{new Date(report.issue_date || report.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
              Instrument Specifications
            </h2>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Model Name:</span><span className="font-semibold text-slate-900">{instrument?.model_name || 'Defender 5000'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Serial Number:</span><span className="font-mono font-semibold text-slate-900">{instrument?.serial_number || 'SN-DEMO-001'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Accuracy Class:</span><span className="font-semibold text-slate-900">Class {instrument?.accuracy_class || 'III'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Scale Interval (e):</span><span className="font-semibold text-slate-900">0.005 kg</span></div>
            </div>
          </div>
        </div>

        {/* Section 2: Summary of Results */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Summary of Executed Test Sequences
          </h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5 text-left">Test Category</th>
                  <th className="px-4 py-2.5 text-left">Standard Reference</th>
                  <th className="px-4 py-2.5 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testCases.length > 0 ? (
                  testCases.map((tc) => (
                    <tr key={tc.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{tc.test_name}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono">OIML R-76: {tc.test_type}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          tc.overall_result === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                          tc.overall_result === 'FAIL' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {tc.overall_result || 'PASS'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr><td className="px-4 py-2.5 font-medium text-slate-900">Linearity & Hysteresis</td><td className="px-4 py-2.5 text-slate-500 font-mono">OIML R-76: Clause 3.5.1</td><td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">PASS</span></td></tr>
                    <tr><td className="px-4 py-2.5 font-medium text-slate-900">Repeatability</td><td className="px-4 py-2.5 text-slate-500 font-mono">OIML R-76: Clause 3.6.1</td><td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">PASS</span></td></tr>
                    <tr><td className="px-4 py-2.5 font-medium text-slate-900">Eccentric Loading</td><td className="px-4 py-2.5 text-slate-500 font-mono">OIML R-76: Clause 3.6.2</td><td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">PASS</span></td></tr>
                    <tr><td className="px-4 py-2.5 font-medium text-slate-900">Discrimination</td><td className="px-4 py-2.5 text-slate-500 font-mono">OIML R-76: Clause 3.8</td><td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">PASS</span></td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Final Conclusion */}
        <div className={`rounded-xl p-5 border text-xs leading-relaxed ${
          isPass ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="font-bold text-sm mb-1">Formal Evaluation Conclusion</div>
          <p>
            {isPass 
              ? 'The non-automatic weighing instrument described herein HAS SATISFIED the requirements for Pattern Approval in accordance with OIML Recommendation R-76:2006 for the tested metrological parameters.'
              : 'The non-automatic weighing instrument described herein HAS NOT satisfied the requirements for Pattern Approval in accordance with OIML Recommendation R-76:2006.'}
          </p>
        </div>

        {/* Cryptographic Digest Info */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Cryptographic Integrity Digest:</span>
            <span className="font-mono text-slate-800 font-bold select-all">{report.sha256_hash || 'SHA-256 Digest calculated on issuance'}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            This digital report record is securely registered in the MetriSure platform repository.
          </p>
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

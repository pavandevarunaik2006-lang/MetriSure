import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  QrCode, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowLeft, 
  Download, 
  Hash, 
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { apiClient, getApiUrl } from '../api/client';

export function VerificationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [lookupInput, setLookupInput] = useState('');
    const [verifyData, setVerifyData] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const runVerification = async (targetId: string | number) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const [verifyRes, repRes] = await Promise.all([
                apiClient.get(`/reports/${targetId}/verify`),
                apiClient.get(`/reports/${targetId}`),
            ]);
            setVerifyData(verifyRes.data);
            setReportData(repRes.data);
        } catch (err: any) {
            console.error('Verification query failed:', err);
            setErrorMsg(err.response?.data?.detail || 'Report could not be verified or not found.');
            setVerifyData(null);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            runVerification(id);
        } else {
            setVerifyData(null);
            setReportData(null);
        }
    }, [id]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = lookupInput.trim();
        if (!trimmed) return;

        setLoading(true);
        setErrorMsg(null);
        try {
            // Lookup report by ID or report_number
            const res = await apiClient.get(`/reports/lookup/${encodeURIComponent(trimmed)}`);
            navigate(`/verification/${res.data.id}`);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || `No report matching '${trimmed}' found in repository.`);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Digital Report Verification
                        </h1>
                        <p className="text-xs text-slate-500">
                            Cryptographic artifact verification for formal NAWI test reports.
                        </p>
                    </div>
                </div>

                <Link
                    to="/reports"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Reports
                </Link>
            </div>

            {/* Lookup Search Bar */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Enter Report ID or Number (e.g. 1 or REP-2023-001)..."
                        value={lookupInput}
                        onChange={(e) => setLookupInput(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !lookupInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Verify Report
                </button>
            </form>

            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>{errorMsg}</div>
                </div>
            )}

            {loading && (
                <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-xs font-medium">Verifying cryptographic signature & hash...</p>
                </div>
            )}

            {/* Verification Result Display */}
            {!loading && verifyData && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-inner">
                        {verifyData.verified ? (
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="h-9 w-9" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                <XCircle className="h-9 w-9" />
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">
                            {verifyData.verified ? 'DIGITALLY VERIFIED' : 'VERIFICATION MISMATCH'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                            {verifyData.verified
                                ? 'The cryptographic digest of this report artifact matches the SHA-256 fingerprint registered in the MetriSure repository.'
                                : 'The cryptographic hash on record does not match the file on disk, or the artifact could not be authenticated.'}
                        </p>
                    </div>

                    {/* Metadata Box */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-left max-w-lg mx-auto space-y-2.5 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Report Number:</span>
                            <span className="font-mono font-bold text-slate-900">{verifyData.report_number}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Session Number:</span>
                            <Link to={`/test-sessions/${verifyData.session_id}`} className="font-medium text-blue-600 hover:underline">
                                {verifyData.session_number || `Session #${verifyData.session_id}`}
                            </Link>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Compliance Result:</span>
                            <span className={`font-bold ${verifyData.overall_result === 'FAIL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {verifyData.overall_result || 'PASS'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Date Issued:</span>
                            <span className="font-medium text-slate-900">
                                {new Date(verifyData.issue_date || verifyData.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Artifact Hash Match:</span>
                            <span className={`font-semibold ${verifyData.hash_match ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {verifyData.hash_match ? 'MATCH CONFIRMED' : 'HASH MISMATCH'}
                            </span>
                        </div>
                        <div className="pt-1">
                            <span className="text-slate-400 block mb-1 font-mono flex items-center gap-1">
                                <Hash className="h-3 w-3" /> SHA-256 Digest:
                            </span>
                            <span className="font-mono text-[10px] text-slate-800 break-all select-all font-semibold block bg-white p-2 rounded border border-slate-200">
                                {verifyData.hash || 'Not available'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link 
                            to={`/reports/${verifyData.id || id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <span>Inspect Report</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <a 
                            href={getApiUrl(`/api/reports/${verifyData.id || id}/pdf`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Verified PDF</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Scope Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center leading-relaxed">
                <strong>Integrity Assurance Notice:</strong> Cryptographic verification guarantees bitstream parity of the stored test report against the registered cryptographic hash. It does not certify hardware physical tamper-proofing.
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

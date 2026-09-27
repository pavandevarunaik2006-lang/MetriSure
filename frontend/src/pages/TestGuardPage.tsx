import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck,
    AlertTriangle,
    AlertCircle,
    ArrowLeft,
    RefreshCw,
    Flag,
    CheckCircle2,
    Eye,
    Layers,
    Thermometer,
    FileText,
    ExternalLink,
    Clock,
    User as UserIcon
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

interface Finding {
    id: string;
    category: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    label: string;
    title: string;
    explanation: string;
    affectedObject: string;
    linkUrl: string;
    linkLabel: string;
    recommendedAction: string;
}

export function TestGuardPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [session, setSession] = useState<any>(null);
    const [testCases, setTestCases] = useState<any[]>([]);
    const [evidenceList, setEvidenceList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Flag / Dismiss Modal or Form
    const [flagNote, setFlagNote] = useState('');
    const [dismissNote, setDismissNote] = useState('');
    const [showFlagInput, setShowFlagInput] = useState(false);
    const [showDismissInput, setShowDismissInput] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            const [sessRes, tcRes, evRes] = await Promise.all([
                apiClient.get(`/test-sessions/${id}`),
                apiClient.get(`/test-cases/session/${id}`),
                apiClient.get(`/evidence/session/${id}`)
            ]);
            setSession(sessRes.data);
            setTestCases(tcRes.data || []);
            setEvidenceList(evRes.data || []);
        } catch (err: any) {
            console.error('Failed to load TestGuard data:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to load test session analysis.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAction = async (action: 'FLAG' | 'DISMISS') => {
        setActionLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const note = action === 'FLAG' ? flagNote : dismissNote;
            const res = await apiClient.post(`/test-sessions/${id}/testguard`, {
                action,
                notes: note.trim() || undefined,
            });
            setSuccessMsg(
                action === 'FLAG'
                    ? 'Advisory flag submitted: REVIEW RECOMMENDED registered for reviewers.'
                    : 'Advisory dismissed: recorded in audit log.'
            );
            setShowFlagInput(false);
            setShowDismissInput(false);
            setFlagNote('');
            setDismissNote('');
            await fetchData();
        } catch (err: any) {
            console.error('TestGuard action failed:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to submit TestGuard action.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Loading TestGuard AI Analysis...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Test Session Not Found</h2>
                <p className="text-slate-600 mb-6">Could not load details for session ID {id}.</p>
                <button
                    onClick={() => navigate('/testguard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                    Select Another Session
                </button>
            </div>
        );
    }

    // Derive actual data-driven findings from real database state
    const findings: Finding[] = [];

    // 1. Evidence Mismatches
    const mismatchEvidence = evidenceList.filter((e) => e.verification_status === 'MISMATCH');
    if (mismatchEvidence.length > 0) {
        mismatchEvidence.forEach((ev, idx) => {
            findings.push({
                id: `TG-FINDING-EVD-${ev.id || idx + 1}`,
                category: 'Evidence Integrity',
                severity: 'HIGH',
                label: 'REVIEW RECOMMENDED',
                title: `Physical Display Mismatch: ${ev.file_name}`,
                explanation: `OCR reading "${ev.ocr_result || 'N/A'}" conflicts with the recorded observation value. Visual indicator check required.`,
                affectedObject: `Evidence #${ev.id} (${ev.file_name})`,
                linkUrl: `/visualproof/${session.id}`,
                linkLabel: 'Open in VisualProof',
                recommendedAction: 'Inspect OCR display capture and verify indication against official scale weights.',
            });
        });
    }

    // 2. Environmental Baseline Deviation
    const baselineTemp = 20.0;
    const tempTolerance = 2.0; // OIML R-76 nominal baseline range +/-2°C
    if (session.env_temperature !== null && session.env_temperature !== undefined) {
        const diff = Math.abs(session.env_temperature - baselineTemp);
        if (diff > tempTolerance) {
            findings.push({
                id: 'TG-FINDING-ENV-01',
                category: 'Environmental Baseline',
                severity: 'MEDIUM',
                label: 'REVIEW RECOMMENDED',
                title: `Environmental Temperature Deviation (${session.env_temperature} °C)`,
                explanation: `Recorded ambient temperature of ${session.env_temperature} °C deviates from standard laboratory reference baseline (${baselineTemp} °C ± ${tempTolerance} °C).`,
                affectedObject: `Session ${session.session_number} Environmental Settings`,
                linkUrl: `/test-sessions/${session.id}`,
                linkLabel: 'View Session Details',
                recommendedAction: 'Verify instrument temperature rating and thermal equilibrium stability prior to approval.',
            });
        }
    }

    // 3. Evidence Completeness (Test cases lacking uploaded visual evidence)
    const testCasesWithEvidence = new Set(evidenceList.map((e) => e.test_case_id).filter(Boolean));
    const testCasesWithoutEvidence = testCases.filter((tc) => tc.status === 'COMPLETED' && !testCasesWithEvidence.has(tc.id));
    if (testCasesWithoutEvidence.length > 0) {
        findings.push({
            id: 'TG-FINDING-EVD-COMPLETION',
            category: 'Evidence Completeness',
            severity: 'LOW',
            label: 'ADVISORY',
            title: `${testCasesWithoutEvidence.length} Completed Test(s) Lack Display Capture`,
            explanation: `Completed test sequence (${testCasesWithoutEvidence.map((t) => t.test_name).join(', ')}) executed without digital camera capture attachment.`,
            affectedObject: `${testCasesWithoutEvidence.length} Test Case(s)`,
            linkUrl: `/test-execution/${session.id}`,
            linkLabel: 'Open Test Execution',
            recommendedAction: 'Upload visual display photographs to reinforce audit defensibility.',
        });
    }

    // 4. Pending Test Cases
    const pendingCases = testCases.filter((tc) => tc.status === 'PENDING' || tc.status === 'IN_PROGRESS');
    if (pendingCases.length > 0) {
        findings.push({
            id: 'TG-FINDING-WORKFLOW-01',
            category: 'Readiness & Completeness',
            severity: 'LOW',
            label: 'ADVISORY',
            title: `${pendingCases.length} Test Sequence(s) Incomplete`,
            explanation: `Test session has incomplete tests awaiting observations: ${pendingCases.map((t) => t.test_name).join(', ')}.`,
            affectedObject: `Session ${session.session_number}`,
            linkUrl: `/test-execution/${session.id}`,
            linkLabel: 'Continue Execution',
            recommendedAction: 'Record all mandatory test point observations before report compilation.',
        });
    }

    // Parse existing flag notes if present
    const notesStr = session.env_notes || '';
    const flagHistory = notesStr
        .split('\n')
        .filter((l: string) => l.includes('[TESTGUARD'))
        .map((line: string, i: number) => ({
            id: i,
            text: line,
            isFlag: line.includes('REVIEW RECOMMENDED'),
            isDismiss: line.includes('DISMISSED')
        }));

    const isCurrentlyFlagged = flagHistory.length > 0 && flagHistory[flagHistory.length - 1].isFlag;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            {/* Workflow Stepper */}
            <WorkflowStepper sessionId={session.id} sessionNumber={session.session_number} currentStep="EXECUTION" />

            {/* Header & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            to="/test-sessions"
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                        >
                            <ArrowLeft className="h-3 w-3" /> Test Sessions
                        </Link>
                        <span className="text-slate-300">/</span>
                        <Link
                            to={`/test-sessions/${session.id}`}
                            className="text-xs text-blue-600 hover:underline font-medium"
                        >
                            {session.session_number}
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <ShieldCheck className="h-7 w-7 text-indigo-600" />
                        TestGuard AI Advisory — Session {session.session_number}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                    <Link
                        to={`/visualproof/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        VisualProof &rarr;
                    </Link>
                    <Link
                        to={`/provenance/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        Provenance &rarr;
                    </Link>
                </div>
            </div>

            {/* Invariant Governance Notice */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3 text-xs text-indigo-900 leading-relaxed">
                <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                    <strong>TestGuard Governance Protocol:</strong> TestGuard performs automated heuristics and anomaly pattern detection to guide quality assurance. <em>TestGuard findings are strictly advisory</em> and NEVER mutate, override, or alter official deterministic OIML R-76 compliance calculations.
                </div>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>{errorMsg}</div>
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>{successMsg}</div>
                </div>
            )}

            {/* Flagged Status Card */}
            {isCurrentlyFlagged && (
                <div className="bg-amber-50 rounded-xl border border-amber-300 p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Flag className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                Active Advisory Flag: REVIEW RECOMMENDED
                            </div>
                            <p className="text-xs text-amber-800 mt-1">
                                An operator or reviewer has flagged this session for detailed review. Reviewers and Approvers have been notified.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Findings List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                            Automated Advisory Findings ({findings.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            Heuristic checks evaluated against active session records.
                        </p>
                    </div>
                    {findings.length > 0 ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full uppercase tracking-wider">
                            REVIEW RECOMMENDED
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full uppercase tracking-wider">
                            NO ADVISORY ANOMALIES
                        </span>
                    )}
                </div>

                {findings.length === 0 ? (
                    <div className="p-8 text-center">
                        <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-base font-bold text-slate-800 mb-1">All Checks Clear</h4>
                        <p className="text-xs text-slate-500">
                            No environmental deviations, unverified evidence, or completeness warnings detected for Session {session.session_number}.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {findings.map((f) => (
                            <div key={f.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-500">
                                            {f.id}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                            {f.category}
                                        </span>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 ${
                                            f.severity === 'HIGH'
                                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                : f.severity === 'MEDIUM'
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}
                                    >
                                        {f.label}
                                    </span>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h4>
                                <p className="text-xs text-slate-600 mb-3 leading-relaxed">{f.explanation}</p>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-slate-500">Affected Object:</span>
                                        <Link
                                            to={f.linkUrl}
                                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            {f.affectedObject} <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-slate-500">Recommended Action:</span>
                                        <span className="font-medium text-slate-800">{f.recommendedAction}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Interactive Action Bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="text-xs text-slate-500">
                            Logged in as: <strong className="text-slate-700">{user?.email}</strong> ({user?.role})
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowDismissInput((prev) => !prev);
                                    setShowFlagInput(false);
                                }}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Dismiss Warning
                            </button>
                            <button
                                onClick={() => {
                                    setShowFlagInput((prev) => !prev);
                                    setShowDismissInput(false);
                                }}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                            >
                                <Flag className="h-3.5 w-3.5" /> Flag for Reviewer
                            </button>
                        </div>
                    </div>

                    {/* Flag Input Form */}
                    {showFlagInput && (
                        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 mt-2">
                            <label className="block text-xs font-bold text-amber-900">
                                Reason for Flagging (Notifies Reviewers)
                            </label>
                            <input
                                type="text"
                                value={flagNote}
                                onChange={(e) => setFlagNote(e.target.value)}
                                placeholder="e.g. Temperature unstable during eccentricity measurement..."
                                className="w-full text-xs rounded-lg border border-amber-300 p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setShowFlagInput(false)}
                                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction('FLAG')}
                                    disabled={actionLoading}
                                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5"
                                >
                                    {actionLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
                                    Confirm Flag
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dismiss Input Form */}
                    {showDismissInput && (
                        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2 mt-2">
                            <label className="block text-xs font-bold text-slate-800">
                                Justification for Dismissal (Logged to Audit Trail)
                            </label>
                            <input
                                type="text"
                                value={dismissNote}
                                onChange={(e) => setDismissNote(e.target.value)}
                                placeholder="e.g. Verified with secondary master thermometer..."
                                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setShowDismissInput(false)}
                                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction('DISMISS')}
                                    disabled={actionLoading}
                                    className="px-3 py-1 bg-slate-700 text-white rounded text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5"
                                >
                                    {actionLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                                    Confirm Dismissal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historical Flag Log */}
            {flagHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> TestGuard Advisory History
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                        {flagHistory.map((item: { id: number; text: string; isFlag: boolean; isDismiss: boolean }) => (
                            <div
                                key={item.id}
                                className={`p-2.5 rounded-lg border text-xs ${
                                    item.isFlag
                                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Context Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Session Environmental & Contextual Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Nominal Baseline Temp:</span>
                        <span className="font-semibold text-slate-900">{baselineTemp.toFixed(1)} °C</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Recorded Session Temp:</span>
                        <span className="font-semibold text-amber-700">
                            {session.env_temperature !== null && session.env_temperature !== undefined ? `${session.env_temperature} °C` : 'N/A'}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Recorded Humidity:</span>
                        <span className="font-semibold text-slate-900">
                            {session.env_humidity !== null && session.env_humidity !== undefined ? `${session.env_humidity} %` : 'N/A'}
                        </span>
                    </div>
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
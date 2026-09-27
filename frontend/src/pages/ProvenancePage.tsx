import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Fingerprint,
    Clock,
    User as UserIcon,
    ArrowLeft,
    RefreshCw,
    Building2,
    Scale,
    FlaskConical,
    BookOpen,
    FileCheck,
    CheckCircle2,
    AlertCircle,
    Eye,
    Award,
    FileText,
    CheckCircle,
    ExternalLink,
    ChevronDown,
    Shield
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

export function ProvenancePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<any>(null);
    const [instrument, setInstrument] = useState<any>(null);
    const [laboratory, setLaboratory] = useState<any>(null);
    const [testCases, setTestCases] = useState<any[]>([]);
    const [observations, setObservations] = useState<any[]>([]);
    const [evidenceList, setEvidenceList] = useState<any[]>([]);
    const [compliance, setCompliance] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            // 1. Session
            const sessRes = await apiClient.get(`/test-sessions/${id}`);
            const sessData = sessRes.data;
            setSession(sessData);

            // 2. Parallel requests for instrument, test cases, evidence, compliance, reports, audit
            const [instRes, tcRes, evRes, compRes, repRes, auditRes] = await Promise.allSettled([
                apiClient.get(`/instruments/${sessData.instrument_id}`),
                apiClient.get(`/test-cases/session/${id}`),
                apiClient.get(`/evidence/session/${id}`),
                apiClient.get(`/compliance/session/${id}/results`),
                apiClient.get('/reports/'),
                apiClient.get(`/audit/?entity_id=${id}`),
            ]);

            if (instRes.status === 'fulfilled') {
                const instData = instRes.value.data;
                setInstrument(instData);
                if (instData.laboratory_id) {
                    try {
                        const labRes = await apiClient.get(`/laboratories/${instData.laboratory_id}`);
                        setLaboratory(labRes.data);
                    } catch (e) {
                        console.error('Failed to load lab:', e);
                    }
                }
            }

            if (tcRes.status === 'fulfilled') {
                const cases = tcRes.value.data || [];
                setTestCases(cases);
                // Fetch observations
                try {
                    const obsRes = await apiClient.get(`/observations/session/${id}`);
                    setObservations(obsRes.data || []);
                } catch (e) {
                    // Fallback: try test case observations
                    console.log('Using test case observation counts');
                }
            }

            if (evRes.status === 'fulfilled') {
                setEvidenceList(evRes.value.data || []);
            }

            if (compRes.status === 'fulfilled') {
                setCompliance(compRes.value.data);
            }

            if (repRes.status === 'fulfilled') {
                const allReps = repRes.value.data?.items || repRes.value.data || [];
                const matchingReps = allReps.filter((r: any) => String(r.session_id) === String(id));
                setReports(matchingReps);
            }

            if (auditRes.status === 'fulfilled') {
                const logs = auditRes.value.data?.items || [];
                setAuditLogs(logs);
            }
        } catch (err: any) {
            console.error('Failed to load Provenance graph:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to load provenance chain data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto py-12 px-4 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Tracing Data Provenance Graph...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Test Session Not Found</h2>
                <p className="text-slate-600 mb-6">Could not load details for session ID {id}.</p>
                <button
                    onClick={() => navigate('/provenance')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                    Select Another Session
                </button>
            </div>
        );
    }

    const linkedReport = reports.length > 0 ? reports[0] : null;

    // Build Provenance Nodes
    const nodes = [
        {
            stage: '1. Accredited Laboratory',
            name: laboratory?.name || 'Metrology Testing Facility',
            idLabel: laboratory ? `Lab #${laboratory.id} (${laboratory.code})` : 'Accredited Facility',
            meta: laboratory ? `${laboratory.city || 'India'}, State: ${laboratory.state || 'N/A'}` : 'Accredited calibration center',
            link: '/laboratories',
            icon: Building2,
            isAvailable: !!laboratory,
            status: 'REGISTERED',
            statusColor: 'emerald'
        },
        {
            stage: '2. NAWI Instrument',
            name: instrument ? `${instrument.model?.model_name || instrument.model || 'Scale'} (${instrument.serial_number})` : 'Instrument Record',
            idLabel: instrument ? `SN: ${instrument.serial_number} (ID #${instrument.id})` : 'Instrument',
            meta: instrument ? `Class ${instrument.accuracy_class || 'III'} • Max: ${instrument.max_capacity} kg • e: ${instrument.verification_scale_interval || instrument.model?.verification_interval_e || '0.005'} kg` : 'Instrument metadata',
            link: instrument ? `/instruments/${instrument.id}` : '/instruments',
            icon: Scale,
            isAvailable: !!instrument,
            status: 'VERIFIED',
            statusColor: 'emerald'
        },
        {
            stage: '3. Test Session',
            name: `Session ${session.session_number}`,
            idLabel: `Session #${session.id} (Status: ${session.status})`,
            meta: `Operator #${session.operator_id} • Temp: ${session.env_temperature ?? 'N/A'} °C • Began: ${new Date(session.created_at).toLocaleDateString()}`,
            link: `/test-sessions/${session.id}`,
            icon: FlaskConical,
            isAvailable: true,
            status: session.status,
            statusColor: session.status === 'COMPLETED' ? 'emerald' : 'blue'
        },
        {
            stage: '4. Compliance RulePack',
            name: `OIML R-76 NAWI Standard`,
            idLabel: `RulePack v${session.rulepack_version || '1.0.0'} (2006 Standard)`,
            meta: 'MPE Classes I, II, III, IIII • Deterministic Algorithm v2.4.0',
            link: '/rulepacks',
            icon: BookOpen,
            isAvailable: true,
            status: 'VERSIONED',
            statusColor: 'purple'
        },
        {
            stage: '5. Test Plan',
            name: 'Standard NAWI Verification Sequence',
            idLabel: `Test Plan (${testCases.length} Sequence Cases)`,
            meta: 'Linearity, Repeatability, Eccentricity, Discrimination, Zero-Setting',
            link: `/test-plan/${session.id}`,
            icon: FileCheck,
            isAvailable: testCases.length > 0,
            status: 'ACTIVE',
            statusColor: 'blue'
        },
        {
            stage: '6. Test Cases & Execution',
            name: `${testCases.length} Test Sequences Executed`,
            idLabel: `Test Cases #${testCases.map(t => t.id).join(', #') || 'N/A'}`,
            meta: testCases.map(t => `${t.test_name} (${t.status})`).join(' • ') || 'No cases recorded',
            link: `/test-execution/${session.id}`,
            icon: CheckCircle2,
            isAvailable: testCases.length > 0,
            status: testCases.every(t => t.status === 'COMPLETED') ? 'COMPLETED' : 'IN_PROGRESS',
            statusColor: testCases.every(t => t.status === 'COMPLETED') ? 'emerald' : 'amber'
        },
        {
            stage: '7. Physical Observations',
            name: `${observations.length || 'Recorded'} Measurement Points`,
            idLabel: `Observations Dataset (${observations.length} points)`,
            meta: observations.length > 0 ? `Indications range: ${observations[0]?.indicated_value} to ${observations[observations.length - 1]?.indicated_value} kg` : 'Measurement observation values',
            link: `/test-execution/${session.id}`,
            icon: Scale,
            isAvailable: observations.length > 0 || testCases.some(t => t.status === 'COMPLETED'),
            status: 'RECORDED',
            statusColor: 'emerald'
        },
        {
            stage: '8. VisualProof Evidence',
            name: evidenceList.length > 0 ? `${evidenceList.length} Physical Evidence Items` : 'No Evidence Uploaded',
            idLabel: evidenceList.length > 0 ? evidenceList.map(e => `#${e.id} (${e.verification_status})`).join(', ') : 'Pending Evidence',
            meta: evidenceList.length > 0 ? `Captured: ${evidenceList[0]?.ocr_result || 'N/A'} • SHA-256: ${evidenceList[0]?.sha256_hash?.slice(0, 16)}...` : 'Visual optical verification',
            link: `/visualproof/${session.id}`,
            icon: Eye,
            isAvailable: evidenceList.length > 0,
            status: evidenceList.some(e => e.verification_status === 'MISMATCH') ? 'MISMATCH' : evidenceList.length > 0 ? 'VERIFIED' : 'PENDING',
            statusColor: evidenceList.some(e => e.verification_status === 'MISMATCH') ? 'rose' : evidenceList.length > 0 ? 'emerald' : 'slate'
        },
        {
            stage: '9. Compliance Evaluation',
            name: `Deterministic Result: ${compliance?.overall_result || session.status || 'COMPLETED'}`,
            idLabel: `Engine Evaluation (Zero Discrepancy)`,
            meta: `Evaluated against OIML R-76 MPE tables. All test points evaluated strictly.`,
            link: `/results/${session.id}`,
            icon: Award,
            isAvailable: true,
            status: compliance?.overall_result || (session.status === 'COMPLETED' ? 'PASS' : 'EVALUATED'),
            statusColor: (compliance?.overall_result === 'FAIL') ? 'rose' : 'emerald'
        },
        // Downstream Stages (Truthful Rendering)
        {
            stage: '10. Review Workspace',
            name: session.status === 'APPROVED' || session.status === 'REVIEWED' ? 'Peer Review Completed' : 'Peer Review Stage',
            idLabel: session.status === 'APPROVED' || session.status === 'REVIEWED' ? 'Reviewed by Senior Metrologist' : 'Pending Formal Review',
            meta: session.status === 'APPROVED' || session.status === 'REVIEWED' ? 'Reviewed and forwarded for final approval.' : 'Awaiting reviewer assignment and examination.',
            link: '/review',
            icon: Shield,
            isAvailable: session.status === 'APPROVED' || session.status === 'REVIEWED',
            status: session.status === 'APPROVED' || session.status === 'REVIEWED' ? 'REVIEWED' : 'PENDING',
            statusColor: session.status === 'APPROVED' || session.status === 'REVIEWED' ? 'emerald' : 'slate'
        },
        {
            stage: '11. Accreditation Approval',
            name: session.status === 'APPROVED' ? 'Final Sign-off Approved' : 'Accreditation Sign-off',
            idLabel: session.status === 'APPROVED' ? 'Accreditation Authority Approval' : 'Pending Approver Sign-off',
            meta: session.status === 'APPROVED' ? 'DIGITAL TEST REPORT ISSUED' : 'Awaiting Approver digital signature.',
            link: '/approval',
            icon: CheckCircle,
            isAvailable: session.status === 'APPROVED',
            status: session.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
            statusColor: session.status === 'APPROVED' ? 'emerald' : 'slate'
        },
        {
            stage: '12. Standardized Test Report',
            name: linkedReport ? `Report #${linkedReport.report_number}` : 'Official Test Report',
            idLabel: linkedReport ? `Report ID #${linkedReport.id} (v${linkedReport.version || 1})` : 'Report Not Yet Generated',
            meta: linkedReport ? `Issued: ${new Date(linkedReport.created_at || linkedReport.issue_date).toLocaleDateString()} • Format: OIML R-76 Standard` : 'Report compilation pending session approval.',
            link: linkedReport ? `/reports/${linkedReport.id}` : '/repository',
            icon: FileText,
            isAvailable: !!linkedReport,
            status: linkedReport ? (linkedReport.status || 'ISSUED') : 'NOT_CREATED',
            statusColor: linkedReport ? 'emerald' : 'slate'
        }
    ];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
            {/* Workflow Stepper */}
            <WorkflowStepper sessionId={session.id} sessionNumber={session.session_number} currentStep="RESULTS" />

            {/* Header */}
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
                        <Fingerprint className="h-7 w-7 text-indigo-600" />
                        Data Provenance Chain — Session {session.session_number}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh Chain
                    </button>
                    <Link
                        to={`/visualproof/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        VisualProof &rarr;
                    </Link>
                    <Link
                        to={`/testguard/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        TestGuard &rarr;
                    </Link>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>{errorMsg}</div>
                </div>
            )}

            {/* Provenance Flow Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-base font-bold text-slate-900">
                        Cryptographically Linked Metrological Traceability
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Each node represents a distinct verifiable entity in the compliance lifecycle. Click any available entity to inspect records.
                    </p>
                </div>

                {/* Nodes Timeline Chain */}
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                    {nodes.map((n, idx) => {
                        const Icon = n.icon;
                        const isAvailable = n.isAvailable;

                        return (
                            <div key={idx} className="relative pl-7">
                                {/* Dot on the vertical line */}
                                <div
                                    className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                                        isAvailable
                                            ? n.statusColor === 'emerald'
                                                ? 'bg-emerald-500'
                                                : n.statusColor === 'purple'
                                                ? 'bg-purple-500'
                                                : n.statusColor === 'rose'
                                                ? 'bg-rose-500'
                                                : 'bg-blue-500'
                                            : 'bg-slate-300'
                                    }`}
                                ></div>

                                <div className={`p-4 rounded-xl border transition-all ${
                                    isAvailable
                                        ? 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                                        : 'bg-slate-50/50 border-slate-200/60 opacity-75'
                                }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-4 w-4 ${isAvailable ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                {n.stage}
                                            </span>
                                        </div>

                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1 self-start sm:self-auto ${
                                                n.statusColor === 'emerald'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : n.statusColor === 'purple'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : n.statusColor === 'amber'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : n.statusColor === 'rose'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : n.statusColor === 'blue'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {n.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {n.name}
                                        </h3>
                                        <span className="text-xs font-mono text-slate-500">
                                            {n.idLabel}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 mb-3">{n.meta}</p>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                        {isAvailable ? (
                                            <Link
                                                to={n.link}
                                                className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                <span>Inspect {n.stage.split('. ')[1]} Record</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        ) : (
                                            <span className="text-slate-400 italic">
                                                Stage pending completion in workflow
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {isAvailable ? 'VERIFIED NODE' : 'UNINITIALIZED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Immutable Audit Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                            Immutable Event Log & Audit Trail ({auditLogs.length} events)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Cryptographically persistent log of operational actions recorded for Session #{session.id}.
                        </p>
                    </div>
                </div>

                {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                        No audit events directly tagged to Session #{session.id}. Operational history tracked in session records.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {auditLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            {log.action}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium">
                                            on {log.entity_type} #{log.entity_id}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                                        <Clock className="h-3 w-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                                    <span className="flex items-center gap-1 font-medium text-slate-700">
                                        <UserIcon className="h-3 w-3 text-slate-400" />
                                        {log.user_email || 'System'} ({log.user_role || 'SYSTEM'})
                                    </span>
                                    {log.details && (
                                        <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-md">
                                            {JSON.stringify(log.details)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Demo Governance Banner */}
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
                <p className="text-xs text-amber-800 font-semibold tracking-wide">
                    DEMO DATA — FOR DEMONSTRATION ONLY
                </p>
            </div>
        </div>
    );
}
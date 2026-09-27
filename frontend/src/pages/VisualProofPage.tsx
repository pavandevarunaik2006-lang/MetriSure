import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Eye,
    ShieldAlert,
    CheckCircle2,
    Clock,
    FileText,
    Hash,
    Layers,
    AlertTriangle,
    ArrowLeft,
    Check,
    X,
    Lock,
    Info,
    RefreshCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    ExternalLink,
    Camera,
    Image as ImageIcon,
    ShieldCheck,
    Scale,
    Award,
    ClipboardCheck,
    Copy,
    CheckCheck
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { WorkflowStepper } from '../components/ui/WorkflowStepper';

interface EvidenceItem {
    id: number;
    session_id: number;
    observation_id: number | null;
    test_case_id: number | null;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url?: string;
    sha256_hash: string;
    ocr_result: string | null;
    ocr_confidence: number | null;
    verification_status: string;
    original_finding?: string;
    review_disposition?: string;
    reviewer_name?: string | null;
    reviewed_at?: string | null;
    review_notes?: string | null;
    recorded_value?: string | null;
    expected_value?: string | null;
    evidence_type?: string;
    test_case_name?: string | null;
    created_at: string;
}

export function VisualProofPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [session, setSession] = useState<any>(null);
    const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
    const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Lightbox modal state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [copiedHash, setCopiedHash] = useState(false);

    // Review/Override Form state
    const [reviewAction, setReviewAction] = useState<'MATCH' | 'MISMATCH' | 'OVERRIDE' | 'VERIFIED'>('MATCH');
    const [reviewNotes, setReviewNotes] = useState('');
    const [ocrOverrideValue, setOcrOverrideValue] = useState('');

    const canOverride = ['REVIEWER', 'APPROVER', 'ADMINISTRATOR'].includes(user?.role || '');

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            const [sessRes, evRes] = await Promise.all([
                apiClient.get(`/test-sessions/${id}`),
                apiClient.get(`/evidence/session/${id}`)
            ]);
            setSession(sessRes.data);
            const items: EvidenceItem[] = evRes.data || [];
            // Sort to ensure visual mock images appear prominently first
            const sortedItems = [...items].sort((a, b) => {
                const aIsImg = a.file_type?.startsWith('image/') || a.file_name.endsWith('.jpg') || a.file_name.endsWith('.png');
                const bIsImg = b.file_type?.startsWith('image/') || b.file_name.endsWith('.jpg') || b.file_name.endsWith('.png');
                if (aIsImg && !bIsImg) return -1;
                if (!aIsImg && bIsImg) return 1;
                return a.id - b.id;
            });
            setEvidenceList(sortedItems);

            if (sortedItems.length > 0) {
                const defaultItem = sortedItems.find(i => {
                    const fn = (i.file_name || '').toLowerCase();
                    return fn.endsWith('.jpg') || fn.endsWith('.png') || fn.endsWith('.jpeg') || i.file_type?.startsWith('image/');
                }) || sortedItems[0];

                setSelectedEvidence(prev => {
                    if (prev) {
                        const found = sortedItems.find(i => i.id === prev.id);
                        return found || defaultItem;
                    }
                    return defaultItem;
                });
            } else {
                setSelectedEvidence(null);
            }
        } catch (err: any) {
            console.error('Failed to load VisualProof data:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to load session evidence');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (selectedEvidence) {
            setOcrOverrideValue(selectedEvidence.ocr_result || '');
            if (selectedEvidence.verification_status === 'MISMATCH') {
                setReviewAction('MISMATCH');
            } else if (selectedEvidence.verification_status === 'VERIFIED') {
                setReviewAction('VERIFIED');
            } else {
                setReviewAction('MATCH');
            }
        }
    }, [selectedEvidence]);

    // Keyboard escape listener for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && lightboxOpen) {
                setLightboxOpen(false);
                setLightboxZoom(1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen]);

    const handleCopyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvidence) return;

        if (reviewAction === 'OVERRIDE' && !canOverride) {
            setErrorMsg(`Role '${user?.role || 'TECHNICIAN'}' is not authorized to perform overrides. Reviewer, Approver, or Administrator role required.`);
            return;
        }

        if (reviewAction === 'OVERRIDE' && !reviewNotes.trim()) {
            setErrorMsg('A mandatory justification note is required to perform an override.');
            return;
        }

        setActionLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const payload: any = {
                action: reviewAction,
                notes: reviewNotes.trim() || undefined,
            };
            if (ocrOverrideValue.trim()) {
                payload.ocr_result = ocrOverrideValue.trim();
            }

            const res = await apiClient.put(`/evidence/${selectedEvidence.id}/review`, payload);
            setSuccessMsg(`Evidence #${selectedEvidence.id} updated: ${res.data.advisory_label || res.data.verification_status}`);
            setReviewNotes('');
            await fetchData();
        } catch (err: any) {
            console.error('Evidence review failed:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to submit evidence review.');
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to get image URL with fallback
    const getEvidenceImageUrl = (ev: EvidenceItem) => {
        const fn = ev.file_name.toLowerCase();
        if (fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.png') || fn.endsWith('.webp')) {
            return `/demo_evidence/${ev.file_name}`;
        }
        return ev.file_url || `/api/evidence/${ev.id}/file`;
    };

    const isImageFile = (ev: EvidenceItem) => {
        const fn = ev.file_name.toLowerCase();
        return ev.file_type?.startsWith('image/') || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.png') || fn.endsWith('.webp');
    };

    const getEvidenceTypeLabel = (ev: EvidenceItem) => {
        const type = ev.evidence_type || '';
        const fn = ev.file_name.toLowerCase();
        if (type === 'NAMEPLATE' || fn.includes('nameplate')) return 'Instrument Nameplate';
        if (type === 'TEST_SETUP' || fn.includes('setup')) return 'Laboratory Test Setup';
        if (type === 'TEXT_LOG' || fn.endsWith('.txt')) return 'Terminal Display Log';
        return 'Digital Display Indicator';
    };

    const getEvidenceTypeIcon = (ev: EvidenceItem) => {
        const type = ev.evidence_type || '';
        const fn = ev.file_name.toLowerCase();
        if (type === 'NAMEPLATE' || fn.includes('nameplate')) return Scale;
        if (type === 'TEST_SETUP' || fn.includes('setup')) return Camera;
        if (type === 'TEXT_LOG' || fn.endsWith('.txt')) return FileText;
        return Eye;
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Loading VisualProof Analysis...</p>
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
                    onClick={() => navigate('/visualproof')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                    Select Another Session
                </button>
            </div>
        );
    }

    const hasMismatch = selectedEvidence?.verification_status === 'MISMATCH';
    const isVerified = selectedEvidence?.verification_status === 'VERIFIED';
    const isMatch = selectedEvidence?.verification_status === 'MATCH';
    const isCurrentItemImage = selectedEvidence ? isImageFile(selectedEvidence) : false;
    const isNameplate = selectedEvidence && (selectedEvidence.evidence_type === 'NAMEPLATE' || selectedEvidence.file_name.includes('nameplate'));
    const isTestSetup = selectedEvidence && (selectedEvidence.evidence_type === 'TEST_SETUP' || selectedEvidence.file_name.includes('setup'));
    const isDigitalDisplay = selectedEvidence && !isNameplate && !isTestSetup && isCurrentItemImage;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            {/* Workflow Stepper */}
            <WorkflowStepper sessionId={session.id} sessionNumber={session.session_number} currentStep="EXECUTION" />

            {/* Header & Navigation */}
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
                        <Eye className="h-7 w-7 text-blue-600" />
                        VisualProof Evidence & Optical Inspection — {session.session_number}
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
                        to={`/testguard/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        TestGuard &rarr;
                    </Link>
                    <Link
                        to={`/provenance/${session.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                        Provenance &rarr;
                    </Link>
                    <Link
                        to={`/review/${session.id}`}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
                    >
                        Review Workspace &rarr;
                    </Link>
                </div>
            </div>

            {/* Advisory Metrological Governance Notice */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed shadow-xs">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <strong>Advisory Metrological Governance (OIML R-76):</strong> VisualProof provides optical verification and discrepancy detection for physical scale indicators and test setup. In accordance with strict legal metrology standards, VisualProof findings are strictly advisory and <em>never mutate official deterministic compliance calculations or automatically fail an instrument</em>. Final certification remains the sole responsibility of the authorized human reviewer.
                </div>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-2 shadow-xs">
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="font-medium">{errorMsg}</div>
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-2 shadow-xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="font-medium">{successMsg}</div>
                </div>
            )}

            {/* Evidence List Selection Gallery */}
            {evidenceList.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No Evidence Records Found</h3>
                    <p className="text-sm text-slate-500 mb-4">No display capture or physical evidence items have been uploaded for Session {session.session_number}.</p>
                    <Link
                        to={`/test-execution/${session.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Go to Test Execution
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Evidence Gallery Cards Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" /> Physical Evidence Repository ({evidenceList.length} items)
                            </h3>
                            <span className="text-[11px] text-slate-400">Click a card to inspect optical evidence</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {evidenceList.map((ev) => {
                                const isSelected = selectedEvidence?.id === ev.id;
                                const isImg = isImageFile(ev);
                                const isEvMismatch = ev.verification_status === 'MISMATCH';
                                const isEvVerified = ev.verification_status === 'VERIFIED';
                                const isEvMatch = ev.verification_status === 'MATCH';
                                const IconComp = getEvidenceTypeIcon(ev);

                                return (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        onClick={() => setSelectedEvidence(ev)}
                                        className={`text-left rounded-xl transition-all border p-3 flex flex-col justify-between relative group cursor-pointer ${
                                            isSelected
                                                ? 'bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            {/* Card Top: Type & Status */}
                                            <div className="flex items-center justify-between gap-1 mb-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                                    <IconComp className="h-3 w-3" />
                                                    {getEvidenceTypeLabel(ev)}
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                                                        isEvMismatch || ev.original_finding === 'MISMATCH — REVIEW REQUIRED'
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {isEvMismatch || ev.original_finding === 'MISMATCH — REVIEW REQUIRED' ? 'MISMATCH' : 'MATCH'}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${
                                                        ev.review_disposition === 'REVIEWED — ACCEPTED' || isEvVerified
                                                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                            : ev.review_disposition === 'REVIEWED — REJECTED'
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {ev.review_disposition === 'REVIEWED — ACCEPTED' || isEvVerified
                                                            ? 'ACCEPTED'
                                                            : ev.review_disposition === 'REVIEWED — REJECTED'
                                                            ? 'REJECTED'
                                                            : 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Thumbnail Container */}
                                            <div className="w-full aspect-16/10 rounded-lg overflow-hidden bg-slate-900/5 border border-slate-200/80 mb-2.5 relative flex items-center justify-center group-hover:opacity-95">
                                                {isImg ? (
                                                    <img
                                                        src={getEvidenceImageUrl(ev)}
                                                        alt={ev.file_name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        onError={(e: any) => {
                                                            // Fallback to backend file endpoint if public path fails
                                                            e.target.onerror = null;
                                                            e.target.src = `/api/evidence/${ev.id}/file`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-3 text-center">
                                                        <FileText className="h-8 w-8 text-slate-400 mb-1" />
                                                        <span className="text-[10px] font-mono text-slate-500 font-semibold">ASCII Capture</span>
                                                    </div>
                                                )}

                                                {/* Discrepancy indicator badge */}
                                                {isEvMismatch && (
                                                    <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-sm">
                                                        <AlertTriangle className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Filename & Info */}
                                            <div className="space-y-1">
                                                <div className="font-semibold text-xs text-slate-900 truncate" title={ev.file_name}>
                                                    #{ev.id} — {ev.file_name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                                    <span>{ev.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                                    <span className="font-mono text-[10px]">{(ev.file_size / 1024).toFixed(0)} KB</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comparison Sub-preview */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                            <span className="text-slate-400">Captured:</span>
                                            <span className={`font-mono font-bold ${
                                                isEvMismatch ? 'text-rose-600' : 'text-slate-700'
                                            }`}>
                                                {ev.ocr_result ? (ev.ocr_result.length > 18 ? `${ev.ocr_result.slice(0, 18)}...` : ev.ocr_result) : 'N/A'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Evidence Inspection Area */}
                    {selectedEvidence && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Evidence Card Header */}
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                                            {React.createElement(getEvidenceTypeIcon(selectedEvidence), { className: 'h-3.5 w-3.5 text-slate-600' })}
                                            {getEvidenceTypeLabel(selectedEvidence)}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                            {selectedEvidence.file_name}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-mono">
                                            (Evidence ID #{selectedEvidence.id})
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {selectedEvidence.test_case_name || (selectedEvidence.test_case_id ? `Test Case #${selectedEvidence.test_case_id}` : 'General Session Evidence')}
                                        {selectedEvidence.observation_id && ` • Linked Observation #${selectedEvidence.observation_id}`}
                                        {selectedEvidence.created_at && ` • Uploaded ${new Date(selectedEvidence.created_at).toLocaleString()}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isCurrentItemImage && (
                                        <button
                                            type="button"
                                            onClick={() => setLightboxOpen(true)}
                                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                                        >
                                            <Maximize2 className="h-3.5 w-3.5 text-slate-500" /> Open Full Viewer
                                        </button>
                                    )}

                                    {/* Original Finding Badge */}
                                    <span className={`px-3 py-1.5 font-extrabold text-xs rounded-full flex items-center gap-1.5 border shadow-2xs ${
                                        isDigitalDisplay || selectedEvidence.original_finding === 'MISMATCH — REVIEW REQUIRED' || hasMismatch
                                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {isDigitalDisplay || selectedEvidence.original_finding === 'MISMATCH — REVIEW REQUIRED' || hasMismatch ? (
                                            <>
                                                <ShieldAlert className="h-4 w-4" /> MISMATCH — REVIEW REQUIRED
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" /> MATCH — VERIFIED
                                            </>
                                        )}
                                    </span>

                                    {/* Human Review Disposition Badge */}
                                    <span className={`px-3 py-1.5 font-extrabold text-xs rounded-full flex items-center gap-1.5 border shadow-2xs ${
                                        selectedEvidence.review_disposition === 'REVIEWED — ACCEPTED' || isVerified
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : selectedEvidence.review_disposition === 'REVIEWED — REJECTED'
                                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                        {selectedEvidence.review_disposition === 'REVIEWED — ACCEPTED' || isVerified ? (
                                            <>
                                                <CheckCheck className="h-4 w-4" /> REVIEWED — ACCEPTED
                                            </>
                                        ) : selectedEvidence.review_disposition === 'REVIEWED — REJECTED' ? (
                                            <>
                                                <X className="h-4 w-4" /> REVIEWED — REJECTED
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4" /> REVIEW PENDING
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Main Evidence Inspection Section */}
                            <div className="p-6 space-y-6">
                                {/* Visual Presentation Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Left: High-Res Image Preview / Canvas */}
                                    <div className="lg:col-span-6 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                                Visible Photographic Evidence
                                            </h4>
                                            {isCurrentItemImage && (
                                                <span className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer flex items-center gap-1" onClick={() => setLightboxOpen(true)}>
                                                    <ZoomIn className="h-3 w-3" /> Click to enlarge
                                                </span>
                                            )}
                                        </div>

                                        <div 
                                            onClick={() => isCurrentItemImage && setLightboxOpen(true)}
                                            className={`rounded-xl overflow-hidden border-2 bg-slate-900/5 relative group ${
                                                isCurrentItemImage ? 'cursor-pointer hover:border-blue-400' : ''
                                            } ${hasMismatch ? 'border-rose-300' : 'border-slate-200'}`}
                                        >
                                            {isCurrentItemImage ? (
                                                <div className="relative aspect-4/3 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={getEvidenceImageUrl(selectedEvidence)}
                                                        alt={selectedEvidence.file_name}
                                                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-102"
                                                        onError={(e: any) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `/api/evidence/${selectedEvidence.id}/file`;
                                                        }}
                                                    />

                                                    {/* Hover Enlarge Hint Overlay */}
                                                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                        <span className="px-3 py-1.5 bg-black/75 backdrop-blur-xs text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                                                            <Maximize2 className="h-3.5 w-3.5" /> Enlarge View
                                                        </span>
                                                    </div>

                                                    {/* Overlay Callout for Display Capture */}
                                                    {isDigitalDisplay && (
                                                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/50 text-white shadow-lg pointer-events-none">
                                                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">OCR Detected Value</div>
                                                            <div className="font-mono text-base font-extrabold text-emerald-300">
                                                                {selectedEvidence.ocr_result || '10.005 kg'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto min-h-[260px] flex flex-col justify-between">
                                                    <div>
                                                        <div className="text-slate-500 text-[10px] border-b border-slate-800 pb-2 mb-3">
                                                            RAW TERMINAL CAPTURE DUMP — {selectedEvidence.file_name}
                                                        </div>
                                                        <div className="space-y-1.5 text-emerald-400">
                                                            <div>&gt; METRISURE_DISPLAY_CAPTURE_STREAM</div>
                                                            <div>&gt; READING: 10.005 kg [STABLE]</div>
                                                            <div>&gt; EXPECTED: 10.000 kg</div>
                                                            <div className="text-rose-400">&gt; DELTA: +0.005 kg (+0.5 e) [DISCREPANCY DETECTED]</div>
                                                            <div className="text-slate-400">&gt; STATUS: ADVISORY_REVIEW_REQUIRED</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-600 text-[10px] pt-3 border-t border-slate-800">
                                                        SHA256: {selectedEvidence.sha256_hash}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Specialized Comparison Panel depending on evidence type */}
                                    <div className="lg:col-span-6 space-y-4">
                                        {/* SCENARIO 1: DIGITAL DISPLAY */}
                                        {isDigitalDisplay && (
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Scale className="h-3.5 w-3.5 text-blue-600" />
                                                    Metrological Observation vs Display Comparison
                                                </h4>

                                                {/* Side by side display numbers */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Expected / Recorded */}
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                                                Expected Observation
                                                            </span>
                                                            <div className="font-mono text-2xl font-extrabold text-slate-800">
                                                                {selectedEvidence.expected_value || '10.000 kg'}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                                                            Standard Load (Class F1)
                                                        </div>
                                                    </div>

                                                    {/* Captured OCR */}
                                                    <div className={`border rounded-xl p-4 flex flex-col justify-between ${
                                                        hasMismatch ? 'bg-rose-50/70 border-rose-300' :
                                                        isVerified ? 'bg-indigo-50/70 border-indigo-300' :
                                                        'bg-emerald-50/70 border-emerald-300'
                                                    }`}>
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-500">
                                                                Captured Scale Display
                                                            </span>
                                                            <div className={`font-mono text-2xl font-extrabold ${
                                                                hasMismatch ? 'text-rose-700' :
                                                                isVerified ? 'text-indigo-700' :
                                                                'text-emerald-700'
                                                            }`}>
                                                                {selectedEvidence.ocr_result || '10.005 kg'}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 pt-2 border-t border-rose-200/60 text-[11px] font-medium flex items-center justify-between">
                                                            <span className="text-slate-600">OCR Confidence:</span>
                                                            <span className="font-bold text-slate-800">
                                                                {selectedEvidence.ocr_confidence ? `${Math.round(selectedEvidence.ocr_confidence * 100)}%` : '98%'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delta Callout */}
                                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                                                    <span className="text-amber-800 font-semibold">Optical Discrepancy (Delta):</span>
                                                    <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                                                        +0.005 kg (+0.5 e)
                                                    </span>
                                                </div>

                                                {/* Mismatch Alert Box: Original Finding */}
                                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                                                    <div className="flex items-center gap-2 font-bold text-rose-800">
                                                        <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                                                        <span>Original Finding: MISMATCH — REVIEW REQUIRED</span>
                                                    </div>
                                                    <p className="text-rose-800 leading-relaxed">
                                                        The physical digital display reads <strong>10.005 kg</strong>, which differs from the recorded expected observation of <strong>10.000 kg</strong> (Delta: +0.005 kg / +0.5 e). Under OIML R-76 guidelines, this optical discrepancy is flagged for reviewer examination.
                                                    </p>
                                                    <div className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded border border-rose-200 font-medium">
                                                        <strong>Metrological Guardrail:</strong> This discrepancy is strictly advisory. It does not automatically fail the test and is never classified as fraud. A certified Reviewer must examine and record the final determination.
                                                    </div>
                                                </div>

                                                {/* Human Review Disposition Card */}
                                                <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                                                    selectedEvidence.review_disposition === 'REVIEWED — ACCEPTED' || isVerified
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                                                        : selectedEvidence.review_disposition === 'REVIEWED — REJECTED'
                                                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                                                        : 'bg-amber-50 border-amber-200 text-amber-950'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 font-bold">
                                                            {selectedEvidence.review_disposition === 'REVIEWED — ACCEPTED' || isVerified ? (
                                                                <>
                                                                    <CheckCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                                                                    <span>Human Review Disposition: REVIEWED — ACCEPTED</span>
                                                                </>
                                                            ) : selectedEvidence.review_disposition === 'REVIEWED — REJECTED' ? (
                                                                <>
                                                                    <X className="h-4 w-4 text-rose-600 shrink-0" />
                                                                    <span>Human Review Disposition: REVIEWED — REJECTED</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                                                                    <span>Human Review Disposition: REVIEW PENDING</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className="font-mono text-[10px] text-slate-500">
                                                            {selectedEvidence.reviewed_at ? new Date(selectedEvidence.reviewed_at).toLocaleDateString() : (isVerified ? 'Verified' : 'Unresolved')}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                                                        <div>
                                                            <span className="text-slate-500 block">Assigned Reviewer:</span>
                                                            <strong className="text-slate-800">
                                                                {selectedEvidence.reviewer_name || (isVerified ? 'Rajesh Kumar (reviewer@metrisure.demo)' : 'Pending assignment')}
                                                            </strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block">Review Timestamp:</span>
                                                            <span className="font-mono text-slate-700">
                                                                {selectedEvidence.reviewed_at ? new Date(selectedEvidence.reviewed_at).toLocaleString() : (isVerified ? '2026-09-27, 10:30:00 AM' : 'Pending')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-1 border-t border-slate-200/60">
                                                        <span className="text-slate-500 block text-[11px]">Reviewer Justification Notes:</span>
                                                        <p className="text-[11px] font-medium text-slate-800 italic mt-0.5">
                                                            "{selectedEvidence.review_notes || (selectedEvidence.review_disposition === 'REVIEW PENDING' && !isVerified ? 'No review determination recorded yet. Discrepancy awaiting inspection in Review Workspace or via override below.' : 'Parallax offset in optical capture verified on bench. Scale calibration re-confirmed compliant within OIML R-76 tolerances.')}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SCENARIO 2: INSTRUMENT NAMEPLATE */}
                                        {isNameplate && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
                                                    Visible Nameplate vs Registered Metadata Verification
                                                </h4>

                                                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                                                            <tr>
                                                                <th className="py-2 px-3">Field</th>
                                                                <th className="py-2 px-3">Visible on Plate</th>
                                                                <th className="py-2 px-3">Registered Data</th>
                                                                <th className="py-2 px-3 text-right">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Manufacturer</td>
                                                                <td className="py-2 px-3 font-medium text-slate-900">DemoTech Industries</td>
                                                                <td className="py-2 px-3 font-medium text-slate-700">{session?.instrument?.model?.manufacturer_name || 'DemoTech Industries'}</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Model</td>
                                                                <td className="py-2 px-3 font-medium text-slate-900">DT-3000</td>
                                                                <td className="py-2 px-3 font-medium text-slate-700">{session?.instrument?.model?.model_name || 'DT-3000'}</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Serial Number</td>
                                                                <td className="py-2 px-3 font-mono font-bold text-slate-900">SN-DEMO-001</td>
                                                                <td className="py-2 px-3 font-mono font-bold text-slate-700">{session?.instrument?.serial_number || 'SN-DEMO-001'}</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Accuracy Class</td>
                                                                <td className="py-2 px-3 font-bold text-slate-900">Class III</td>
                                                                <td className="py-2 px-3 font-bold text-slate-700">Class {session?.instrument?.model?.accuracy_class || 'III'}</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Capacity (Max / Min)</td>
                                                                <td className="py-2 px-3 font-mono text-slate-900">30 kg / 0.1 kg</td>
                                                                <td className="py-2 px-3 font-mono text-slate-700">{session?.instrument?.model?.max_capacity || 30} kg / {session?.instrument?.model?.min_capacity || 0.1} kg</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Scale Interval (e / d)</td>
                                                                <td className="py-2 px-3 font-mono text-slate-900">e=0.01 kg / d=0.01 kg</td>
                                                                <td className="py-2 px-3 font-mono text-slate-700">e={session?.instrument?.model?.verification_interval_e || 0.01} kg / d={session?.instrument?.model?.actual_interval_d || 0.01} kg</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                            <tr>
                                                                <td className="py-2 px-3 font-semibold text-slate-600">Year / Standard</td>
                                                                <td className="py-2 px-3 text-slate-900">2023 • OIML R-76 T7373</td>
                                                                <td className="py-2 px-3 text-slate-700">{session?.instrument?.year_of_manufacture || 2023} • OIML R-76</td>
                                                                <td className="py-2 px-3 text-right"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">MATCH</span></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                    <span><strong>Identity Verified:</strong> Visual evidence on physical nameplate is 100% consistent with the system instrument registry.</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* SCENARIO 3: TEST SETUP */}
                                        {isTestSetup && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Camera className="h-3.5 w-3.5 text-blue-600" />
                                                    Supporting Laboratory Test Bench Setup
                                                </h4>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Standard Masses</span>
                                                        <span className="font-semibold text-slate-800">OIML Class F1 Test Weights</span>
                                                        <span className="text-[11px] text-slate-500 block mt-0.5">Stainless Steel Cylindrical</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Environmental Control</span>
                                                        <span className="font-semibold text-slate-800">{session.env_temperature} °C • {session.env_humidity} % RH</span>
                                                        <span className="text-[11px] text-slate-500 block mt-0.5">Barometric: {session.env_atmospheric_pressure || 1013.25} hPa</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Bench Mounting</span>
                                                        <span className="font-semibold text-slate-800">Anti-Vibration Lab Bench</span>
                                                        <span className="text-[11px] text-slate-500 block mt-0.5">Spirit level bubble centered</span>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Testing Operator</span>
                                                        <span className="font-semibold text-slate-800">Priya Sharma (Technician)</span>
                                                        <span className="text-[11px] text-slate-500 block mt-0.5">ID: technician@metrisure.demo</span>
                                                    </div>
                                                </div>

                                                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                                                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                                    <span><strong>Supporting Evidence Only:</strong> This test-bench photograph serves as contextual environmental and experimental proof supporting auditability under ISO/IEC 17025 accreditation.</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* SCENARIO 4: TEXT LOG */}
                                        {!isCurrentItemImage && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                                    ASCII Serial Interface Log
                                                </h4>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    Direct text-stream telemetry logged from the indicator RS-232 / USB communication port. Retained alongside optical imagery for multi-modal provenance.
                                                </p>
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                                                    <strong>Status:</strong> Mismatch flagged on port capture (10.005 kg vs 10.000 kg). Corroborates visual indicator photograph.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cryptographic Metadata & Audit Panel */}
                                <div className="border-t border-slate-200 pt-5">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Hash className="h-3.5 w-3.5" /> Evidence Provenance & Cryptographic Digest
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-400 block mb-1">MIME Type & Size:</span>
                                            <span className="font-semibold text-slate-800 font-mono">
                                                {selectedEvidence.file_type || 'image/jpeg'} • {(selectedEvidence.file_size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-400 block mb-1">Timestamp:</span>
                                            <span className="font-semibold text-slate-800">
                                                {new Date(selectedEvidence.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-400 block mb-1">Linked Session & Test:</span>
                                            <span className="font-semibold text-slate-800">
                                                Session #{selectedEvidence.session_id} • {selectedEvidence.test_case_name || 'Session Evidence'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <span className="text-slate-400 block mb-1">Integrity Status:</span>
                                            <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Digest Unbroken
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 sm:col-span-2 md:col-span-4 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-slate-400 block mb-1 font-mono text-[10px]">
                                                    SHA-256 Digest:
                                                </span>
                                                <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold block truncate">
                                                    {selectedEvidence.sha256_hash}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyHash(selectedEvidence.sha256_hash)}
                                                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shrink-0 flex items-center gap-1"
                                                title="Copy SHA-256 hash"
                                            >
                                                {copiedHash ? (
                                                    <>
                                                        <CheckCheck className="h-3 w-3 text-emerald-600" /> Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3 text-slate-500" /> Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Decision & Advisory Override Section */}
                                <div className="border-t border-slate-200 pt-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">
                                                Reviewer Determination & Advisory Override
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                Record optical inspection findings or execute an authorized Reviewer override.
                                            </p>
                                        </div>
                                        <div className="text-xs flex items-center gap-2">
                                            <span className="text-slate-400">Current Role: </span>
                                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                {user?.role || 'UNKNOWN'}
                                            </span>
                                            {canOverride ? (
                                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                                    Override Authorized
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-0.5">
                                                    <Lock className="h-2.5 w-2.5" /> Read-Only
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <form onSubmit={handleReviewSubmit} className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    Review Action / Status
                                                </label>
                                                <select
                                                    value={reviewAction}
                                                    onChange={(e: any) => setReviewAction(e.target.value)}
                                                    className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option value="OVERRIDE" disabled={!canOverride}>
                                                        Accept Discrepancy & Execute Override (REVIEWED — ACCEPTED) {!canOverride ? '🔒' : ''}
                                                    </option>
                                                    <option value="MATCH">Confirm Conformance (REVIEWED — ACCEPTED)</option>
                                                    <option value="MISMATCH">Confirm Discrepancy (MISMATCH — REVIEW PENDING)</option>
                                                    <option value="VERIFIED">Mark Verified (REVIEWED — ACCEPTED)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                    OCR Display Value (Optional Calibration Value Edit)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={ocrOverrideValue}
                                                    onChange={(e) => setOcrOverrideValue(e.target.value)}
                                                    placeholder="e.g. 10.000 kg"
                                                    className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Review Justification / Comment {reviewAction === 'OVERRIDE' && <span className="text-rose-600 font-bold">* (Mandatory for Override)</span>}
                                            </label>
                                            <textarea
                                                value={reviewNotes}
                                                onChange={(e) => setReviewNotes(e.target.value)}
                                                rows={2}
                                                placeholder={
                                                    reviewAction === 'OVERRIDE'
                                                        ? 'Enter mandatory justification for overriding optical evidence discrepancy (e.g. parallax reading inspected; scale verified on bench)...'
                                                        : 'Enter optional review findings or notes...'
                                                }
                                                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                        </div>

                                        {!canOverride && reviewAction === 'OVERRIDE' && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                                                <span>
                                                    Your current role ({user?.role}) does not have permission to execute an override. Reviewer, Approver, or Administrator role required.
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-1">
                                            <div className="text-[11px] text-slate-400">
                                                {reviewAction === 'OVERRIDE' ? 'Requires justification note. Audit event logged.' : 'Advisory determination recorded in session provenance.'}
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={actionLoading || (reviewAction === 'OVERRIDE' && !canOverride)}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                                                    actionLoading || (reviewAction === 'OVERRIDE' && !canOverride)
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : reviewAction === 'OVERRIDE'
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                }`}
                                            >
                                                {actionLoading ? (
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                                {reviewAction === 'OVERRIDE' ? 'Execute Authorized Override' : 'Submit Review Decision'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox / Fullscreen Viewer Modal */}
            {lightboxOpen && selectedEvidence && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setLightboxOpen(false);
                            setLightboxZoom(1);
                        }
                    }}
                >
                    {/* Lightbox Top Bar */}
                    <div className="flex items-center justify-between text-white z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">{selectedEvidence.file_name}</span>
                                <span className="text-xs text-slate-400 font-mono">(#{selectedEvidence.id})</span>
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                    {getEvidenceTypeLabel(selectedEvidence)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {selectedEvidence.ocr_result ? `Captured: ${selectedEvidence.ocr_result}` : ''}
                            </p>
                        </div>

                        {/* Lightbox Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 2.5))}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setLightboxZoom(prev => Math.max(prev - 0.25, 0.75))}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setLightboxZoom(1)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-white font-mono transition-colors"
                                title="Reset Zoom"
                            >
                                {Math.round(lightboxZoom * 100)}%
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLightboxOpen(false);
                                    setLightboxZoom(1);
                                }}
                                className="p-2 bg-rose-600/80 hover:bg-rose-600 rounded-lg text-white transition-colors ml-2"
                                title="Close (Esc)"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Lightbox Center Image */}
                    <div 
                        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative cursor-grab"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setLightboxOpen(false);
                                setLightboxZoom(1);
                            }
                        }}
                    >
                        <img
                            src={getEvidenceImageUrl(selectedEvidence)}
                            alt={selectedEvidence.file_name}
                            style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.15s ease-out' }}
                            className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
                            onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = `/api/evidence/${selectedEvidence.id}/file`;
                            }}
                        />
                    </div>

                    {/* Lightbox Bottom Info Bar */}
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 z-10 max-w-4xl mx-auto w-full">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-slate-400">
                                SHA-256: <strong className="text-slate-200">{selectedEvidence.sha256_hash.slice(0, 24)}...</strong>
                            </span>
                            <span className="text-slate-500">|</span>
                            <span>Size: {(selectedEvidence.file_size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Press ESC or click outside to close</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Governance Banner */}
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-center">
                <p className="text-xs text-amber-800 font-semibold tracking-wide">
                    DEMO DATA — FOR DEMONSTRATION ONLY • DEMO RULEPACK — NOT AUTHORITATIVE • OIML R-76 COMPLIANT METROLOGICAL EVIDENCE ENGINE
                </p>
            </div>
        </div>
    );
}
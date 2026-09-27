import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FlaskConical, ChevronRight, Star, ShieldCheck, Camera, CheckCircle2, Clock, FileText } from 'lucide-react';
import { apiClient } from '../api/client';

export function SessionSelectorPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/test-sessions/')
            .then(res => setSessions(res.data.items || res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (id: number) => {
        const base = location.pathname.replace(/\/$/, '');
        navigate(`${base}/${id}`);
    };

    const goldenSession = sessions.find(s => s.session_number === 'TS-1045' || s.id === 1);
    const otherSessions = sessions.filter(s => s.id !== goldenSession?.id);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FlaskConical className="h-6 w-6 text-blue-600" />
                        Select a Test Session
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Select a metrological verification session to inspect records, optical evidence, or compliance results.
                    </p>
                </div>
            </div>

            {/* Featured Golden Demo Card */}
            {goldenSession && (
                <div 
                    onClick={() => handleSelect(goldenSession.id)}
                    className="p-5 rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-wider flex items-center gap-1 shadow-xs">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        Primary Golden Demo Case
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                                    {goldenSession.session_number}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {goldenSession.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium">
                                Instrument: <strong>DemoTech Industries DT-3000</strong> (SN: <code>SN-DEMO-001</code>, Class III, Max: 30 kg)
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-1">
                                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> 5 Test Cases (17 Obs)
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                    <Camera className="h-3.5 w-3.5 text-indigo-600" /> 4 VisualProof Evidence Items (Mock Photos Attached)
                                </span>
                                <span>•</span>
                                <span className="text-slate-500">
                                    Issued Standardized Report & Audit Chain
                                </span>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                            >
                                Open Golden Demo &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Sessions List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    All Available Test Sessions ({sessions.length})
                </h3>

                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-xs text-slate-500">Loading test sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">No test sessions available.</div>
                    ) : (
                        sessions.map(s => {
                            const isGolden = s.id === goldenSession?.id;
                            const isApproved = s.status === 'APPROVED';
                            const isSubmitted = s.status === 'SUBMITTED';

                            return (
                                <div 
                                    key={s.id} 
                                    onClick={() => handleSelect(s.id)} 
                                    className={`p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors ${
                                        isGolden ? 'bg-blue-50/30' : ''
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {s.session_number}
                                            </span>
                                            {isGolden && (
                                                <span className="px-2 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase tracking-wider">
                                                    Golden Demo
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                isApproved ? 'bg-emerald-100 text-emerald-800' :
                                                isSubmitted ? 'bg-indigo-100 text-indigo-800' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                            <span>Instrument #{s.instrument_id || 1}</span>
                                            <span>•</span>
                                            <span>RulePack v{s.rulepack_version || '1.0.0'}</span>
                                            <span>•</span>
                                            <span>Created: {new Date(s.created_at || '').toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Demo Governance Banner */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
                <p className="text-xs text-amber-800 font-semibold tracking-wide">
                    DEMO DATA — FOR DEMONSTRATION ONLY • DEMO RULEPACK — NOT AUTHORITATIVE
                </p>
            </div>
        </div>
    );
}
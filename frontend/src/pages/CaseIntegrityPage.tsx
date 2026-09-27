import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Lock, FileCheck, CheckCircle2, Activity, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { mockTestSessions } from '../mocks/data';

export function CaseIntegrityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const session = mockTestSessions.find(s => s.id === Number(id)) || mockTestSessions[0];
  const isComplete = session.status === 'COMPLETED' || session.status === 'REVIEWER_APPROVED' || session.status === 'APPROVED';

  const chainNodes = [
    { label: 'Instrument Profile', status: 'VERIFIED' },
    { label: 'Test Plan Generation', status: 'VERIFIED' },
    { label: 'Observation Entry', status: 'VERIFIED' },
    { label: 'Evidence (VisualProof)', status: 'VERIFIED' },
    { label: 'Calculation Matrix', status: 'VERIFIED' },
    { label: 'RulePack Constraints', status: 'VERIFIED' },
    { label: 'Compliance Engine', status: 'VERIFIED' },
    { label: 'Human Review', status: isComplete ? 'VERIFIED' : 'PENDING' },
    { label: 'Authority Approval', status: session.status === 'APPROVED' ? 'VERIFIED' : 'PENDING' },
    { label: 'Final Report', status: session.status === 'APPROVED' ? 'VERIFIED' : 'PENDING' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">
      <button 
        onClick={() => navigate(`/test-sessions/${id}`)}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Session
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Case Integrity Validation</h1>
          <p className="text-sm text-slate-500">End-to-end logical validation of the session lifecycle.</p>
        </div>
      </div>
      
      {/* Visual Chain */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 border border-emerald-200 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold tracking-wide text-emerald-800">CASE INTEGRITY VERIFIED</span>
          </div>
        </div>
        
        <h3 className="font-bold text-slate-900 mb-8">Data Provenance Chain</h3>
        
        <div className="relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />
          
          <div className="space-y-6">
            {chainNodes.map((node, i) => (
              <div key={i} className="relative flex items-center gap-4 pl-12 group">
                {/* Node Icon */}
                <div className={clsx(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-sm transition-colors",
                  node.status === 'VERIFIED' ? "bg-emerald-500" : "bg-slate-300"
                )}>
                  {node.status === 'VERIFIED' ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                
                {/* Node Content */}
                <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50 p-3 flex justify-between items-center group-hover:border-slate-200 transition-colors">
                  <span className={clsx(
                    "text-sm font-medium",
                    node.status === 'VERIFIED' ? "text-slate-900" : "text-slate-500"
                  )}>{node.label}</span>
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    node.status === 'VERIFIED' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Data Anchors Verified</h3>
            <p className="text-sm text-slate-500 mb-2">All observations and hashes logically correspond to the compliance engine output.</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">VisualProof Integrity</h3>
            <p className="text-sm text-slate-500 mb-2">Images securely anchored to their respective test records without tampering.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, ShieldCheck, Box, Terminal, PlayCircle
} from 'lucide-react';

export function ReplayCapsulePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Box className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Replay Capsule</h1>
          <p className="text-sm text-slate-500">Download a standalone data snapshot of the session for offline auditing.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mb-8">
          <ShieldCheck className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Capsule TS-1082 is ready</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            This capsule contains the raw observation data, visual proofs, engine binary schema, and the recorded audit log.
          </p>
          <button className="inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Download .mcap Archive (4.2 MB)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-500" /> CLI Replay Instructions
            </h3>
            <div className="bg-[#0f172a] rounded-lg p-4 font-mono text-xs text-slate-300">
              <p className="text-emerald-400 mb-2"># Install the open-source CLI</p>
              <p className="mb-4">$ npm install -g @metrisure/cli</p>
              
              <p className="text-emerald-400 mb-2"># Replay the capsule deterministically</p>
              <p>$ metrisure replay TS-1082.mcap</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-slate-500" /> In-Browser Sandbox
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload any previously generated `.mcap` file to execute the engine purely in the browser environment via WebAssembly, without touching the backend servers.
            </p>
            <button className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
              Select .mcap File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

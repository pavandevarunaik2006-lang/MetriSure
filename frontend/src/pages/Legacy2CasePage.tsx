import { useState } from 'react';
import { 
  ArrowLeft, FileSpreadsheet, UploadCloud, CheckCircle, Database, AlertTriangle
} from 'lucide-react';

export function Legacy2CasePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsDone(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Legacy2Case Data Migration</h1>
          <p className="text-sm text-slate-500">Transform raw CSV/Excel dumps into structured, rule-bound Test Sessions.</p>
        </div>
      </div>

      {!isDone ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-12 text-center transition-colors hover:bg-slate-100 hover:border-blue-400">
            <UploadCloud className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Legacy Dataset</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Drag and drop your historical CSV or Excel files here. The system will automatically map columns to MetriSure schemas and run compliance backtesting.
            </p>
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                'Select File (.csv, .xlsx)'
              )}
            </button>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <Database className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Smart Mapping</h4>
              <p className="text-xs text-slate-500 mt-1">Automatically maps 'Load' and 'Indication' columns.</p>
            </div>
            <div>
              <CheckCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Backtesting</h4>
              <p className="text-xs text-slate-500 mt-1">Runs legacy data through the current compliance engine.</p>
            </div>
            <div>
              <AlertTriangle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Anomaly Detection</h4>
              <p className="text-xs text-slate-500 mt-1">Flags historical data that was falsified or manually bypassed.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Migration Complete</h2>
            <p className="text-slate-500 mt-1">File: NML_Legacy_Logs_2025.csv successfully processed.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
              <p className="text-2xl font-black text-slate-900">1,204</p>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Records Parsed</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
              <p className="text-2xl font-black text-emerald-700">1,180</p>
              <p className="text-xs font-semibold text-emerald-600 uppercase mt-1">Clean Imports</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4 text-center border border-rose-200">
              <p className="text-2xl font-black text-rose-700">24</p>
              <p className="text-xs font-semibold text-rose-600 uppercase mt-1">Anomalies Detected</p>
            </div>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50 overflow-hidden mb-6">
            <div className="bg-rose-100/50 px-4 py-2 border-b border-rose-200 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase text-rose-800">Historical Anomalies</h3>
              <span className="text-xs font-medium text-rose-600">These passed historically but fail Engine Rules</span>
            </div>
            <table className="min-w-full text-sm text-left">
              <thead className="text-rose-700">
                <tr>
                  <th className="px-4 py-2">Legacy ID</th>
                  <th className="px-4 py-2">Test Type</th>
                  <th className="px-4 py-2">Original Status</th>
                  <th className="px-4 py-2">Engine Ruling</th>
                </tr>
              </thead>
              <tbody className="text-rose-900 font-medium bg-white">
                <tr className="border-t border-rose-100">
                  <td className="px-4 py-3">REC-892</td>
                  <td className="px-4 py-3">Eccentricity</td>
                  <td className="px-4 py-3 text-slate-500">PASS (Manual override)</td>
                  <td className="px-4 py-3 text-rose-600 font-bold">FAIL (Error &gt; MPE)</td>
                </tr>
                <tr className="border-t border-rose-100">
                  <td className="px-4 py-3">REC-905</td>
                  <td className="px-4 py-3">Linearity</td>
                  <td className="px-4 py-3 text-slate-500">PASS</td>
                  <td className="px-4 py-3 text-rose-600 font-bold">FAIL (MPE calculation error in legacy)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => { setIsDone(false); setIsUploading(false); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Upload Another File
            </button>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors">
              Commit to Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

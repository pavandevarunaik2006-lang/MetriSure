import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Crosshair, CheckCircle, AlertTriangle, Scale
} from 'lucide-react';
import { mockTestSessions, mockInstruments } from '../mocks/data';
import clsx from 'clsx';

export function RetestPlannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const session = mockTestSessions.find(s => s.id === Number(id)) || mockTestSessions[1]; // fallback to a failed session if possible
  const instrument = mockInstruments.find(i => i.serial_number === session.serial_number) || mockInstruments[0];
  
  // Hardcoded mock data for the retest planner
  const failedTests = [
    { id: 'T-44', category: 'Eccentricity', load: '15.000 kg', position: 'Front Left', error: '0.008 kg', mpe: '0.005 kg' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-6">
      <button 
        onClick={() => navigate(`/test-sessions/${session.id}/results`)}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Results
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <RotateCcw className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Counterfactual Retest Planner</h1>
          <p className="text-sm text-slate-500">AI-assisted targeting of specific failures for efficient re-evaluation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-slate-400" /> Targeted Retest Plan
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Instead of running the entire 64-observation test plan again, the system has identified that repairing and re-evaluating the following specific components will satisfy OIML R-76 requirements.
          </p>

          <div className="rounded-lg border border-rose-200 bg-rose-50 overflow-hidden mb-6">
            <div className="bg-rose-100/50 px-4 py-2 border-b border-rose-200">
              <h3 className="text-xs font-bold uppercase text-rose-800">Failed Observations to Retest</h3>
            </div>
            <table className="min-w-full text-sm text-left">
              <thead className="text-rose-700">
                <tr>
                  <th className="px-4 py-2">Test</th>
                  <th className="px-4 py-2">Condition</th>
                  <th className="px-4 py-2">Recorded Error</th>
                  <th className="px-4 py-2">Target MPE</th>
                </tr>
              </thead>
              <tbody className="text-rose-900 font-medium">
                {failedTests.map(t => (
                  <tr key={t.id} className="border-t border-rose-100">
                    <td className="px-4 py-3">{t.category}</td>
                    <td className="px-4 py-3">{t.load} ({t.position})</td>
                    <td className="px-4 py-3">{t.error}</td>
                    <td className="px-4 py-3">{t.mpe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="inline-flex justify-center items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors">
            <RotateCcw className="h-4 w-4" />
            Generate Partial Retest Session
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Diagnostic Insight</h3>
            <p className="text-sm text-slate-600">
              Failure in <strong>Eccentricity</strong> at the <strong>Front Left</strong> quadrant suggests a potential mechanical leveling issue or load cell misalignment.
            </p>
          </div>
          
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">OIML Constraint</h3>
                <p className="text-xs text-amber-800">
                  If any physical repairs are made to the instrument, a full retest of all parameters may be legally required depending on local jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

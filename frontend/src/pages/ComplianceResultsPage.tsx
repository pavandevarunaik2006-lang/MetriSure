import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle, ArrowLeft, ShieldAlert, FileCheck, AlertTriangle, Check
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';

export function ComplianceResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [metrics, setMetrics] = useState({ isPass: true, total: 0, failed: 0, maxError: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await apiClient.get(`/test-sessions/${id}`);
        setSession(sessionRes.data);

        // Fetch test cases and observations to determine result
        const tcRes = await apiClient.get(`/test-cases/${id}`);
        let total = 0;
        let failed = 0;
        let maxError = 0;

        for (const tc of tcRes.data) {
          const obsRes = await apiClient.get(`/observations/test-case/${tc.id}`);
          for (const obs of obsRes.data) {
            total++;
            if (obs.result === 'FAIL') failed++;
            if (Math.abs(obs.error) > Math.abs(maxError)) maxError = obs.error;
          }
        }

        setMetrics({ isPass: failed === 0, total, failed, maxError });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!session) return <div>Failed to load results</div>;

  const instrument = session.instrument;
  const isPass = metrics.isPass;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <button 
        onClick={() => navigate(`/test-sessions/${id}`)}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Session
      </button>

      {/* Hero Banner */}
      <div className={clsx(
        "rounded-2xl border p-8 mb-8 flex flex-col items-center text-center",
        isPass 
          ? "bg-emerald-50 border-emerald-200 shadow-sm" 
          : "bg-rose-50 border-rose-200 shadow-sm"
      )}>
        <div className={clsx(
          "flex h-20 w-20 items-center justify-center rounded-full mb-6",
          isPass ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}>
          {isPass ? <CheckCircle className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
        </div>
        
        <h1 className={clsx("text-3xl font-bold mb-2", isPass ? "text-emerald-900" : "text-rose-900")}>
          Type Evaluation {isPass ? 'Passed' : 'Failed'}
        </h1>
        <p className={clsx("text-sm max-w-lg", isPass ? "text-emerald-700" : "text-rose-700")}>
          {isPass 
            ? "The instrument successfully met all permissible error bounds and compliance rules as verified by the deterministic Compliance Engine." 
            : "The instrument exceeded permissible error bounds during testing. See DecisionTrace for details."}
        </p>
        
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => navigate(`/test-sessions/${session.id}/decision-trace`)}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-blue-600" />
            View DecisionTrace
          </button>
          
          <button 
            onClick={() => navigate('/review')}
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors",
              isPass ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            )}
          >
            <FileCheck className="h-4 w-4" />
            Proceed to Review
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Instrument Tested</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Model</dt><dd className="font-medium text-slate-900">{instrument?.model?.model_name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Serial Number</dt><dd className="font-medium text-slate-900">{instrument?.serial_number}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Accuracy Class</dt><dd className="font-medium text-slate-900">Class {instrument?.model?.accuracy_class}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Max Capacity</dt><dd className="font-medium text-slate-900">{instrument?.model?.max_capacity} {instrument?.model?.unit}</dd></div>
          </dl>
        </div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Session Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Session ID</dt><dd className="font-medium text-slate-900">{session.id}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{new Date(session.created_at).toLocaleDateString()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">RulePack</dt><dd className="font-medium text-blue-600">{session.rulepack_version}</dd></div>
          </dl>
        </div>
      </div>

      {/* Test Breakdown */}
      <h3 className="text-lg font-bold text-slate-900 mb-4">Test Breakdown</h3>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="divide-y divide-slate-100">
          
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Total Observations Evaluated</p>
                <p className="text-sm text-slate-500">{metrics.total} observations · Max error: {metrics.maxError.toFixed(4)}</p>
              </div>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View Data</button>
          </div>
          
          {!isPass && (
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-rose-50/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Failed Tests</p>
                <p className="text-sm text-rose-600 font-medium">{metrics.failed} failures detected. See DecisionTrace for exact bounds.</p>
              </div>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View Data</button>
          </div>
          )}

        </div>
      </div>

    </div>
  );
}

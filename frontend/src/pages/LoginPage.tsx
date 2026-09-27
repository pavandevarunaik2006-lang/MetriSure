import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff, User, Shield, CheckCircle, Wrench } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

const demoUsers = [
  { email: 'technician@metrisure.demo', name: 'Priya Sharma', role: 'Technician', icon: Wrench, color: 'blue' },
  { email: 'reviewer@metrisure.demo', name: 'Rajesh Kumar', role: 'Reviewer', icon: CheckCircle, color: 'amber' },
  { email: 'approver@metrisure.demo', name: 'Dr. Anita Desai', role: 'Approver', icon: Shield, color: 'emerald' },
  { email: 'admin@metrisure.demo', name: 'Vikram Singh', role: 'Administrator', icon: User, color: 'violet' },
];

const colorMap: Record<string, { bg: string; border: string; hover: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100', text: 'text-amber-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100', text: 'text-emerald-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', hover: 'hover:bg-violet-100', text: 'text-violet-700' },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'demo123');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Quick demo login failed. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex flex-col justify-center px-4 py-12">
      {/* Brand */}
      <div className="mx-auto w-full max-w-md text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-blue-500/25 mb-4">
          <Scale className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">MetriSure</h1>
        <p className="mt-2 text-sm text-slate-400">
          Integrity-first digital testing for NAWI type evaluation
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Capture · Verify · Calculate · Explain · Reconcile · Approve · Report
        </p>
      </div>

      {/* Login card */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
          <div className="rounded-xl bg-white p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0f172a] py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Demo Access</span>
              </div>
            </div>

            {/* Demo users */}
            <div className="grid grid-cols-2 gap-2.5">
              {demoUsers.map((u) => {
                const c = colorMap[u.color];
                return (
                  <button
                    key={u.email}
                    onClick={() => demoLogin(u.email)}
                    disabled={loading}
                    className={clsx(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 transition-all duration-150',
                      c.bg, c.border, c.hover,
                      'disabled:opacity-50'
                    )}
                  >
                    <u.icon className={clsx('h-5 w-5', c.text)} />
                    <span className={clsx('text-sm font-semibold', c.text)}>{u.role}</span>
                    <span className="text-[11px] text-slate-500">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-[11px] text-slate-500/60">
          DEMO RULEPACK — NOT AUTHORITATIVE · SIH26035 · OIML R-76
        </p>
      </div>
    </div>
  );
}

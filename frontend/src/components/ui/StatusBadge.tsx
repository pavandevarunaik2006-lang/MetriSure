import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, AlertTriangle, Clock, ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase().trim();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon: React.ReactNode = null;

  switch (norm) {
    case 'PASS':
    case 'APPROVED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'VERIFIED':
    case 'MATCH':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/10';
      icon = <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />;
      break;

    case 'FAIL':
    case 'REJECTED':
    case 'BLOCKED':
    case 'INACTIVE':
    case 'ERROR':
      bg = 'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-500/10';
      icon = <XCircle className="h-3 w-3 text-rose-600 shrink-0" />;
      break;

    case 'RETEST_REQUIRED':
    case 'CORRECTION_REQUIRED':
    case 'MISMATCH':
    case 'MISMATCH — REVIEW REQUIRED':
      bg = 'bg-rose-50 text-rose-900 border-rose-300 font-semibold';
      icon = <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />;
      break;

    case 'REVIEW RECOMMENDED':
    case 'WARNING':
    case 'UNDER_REVIEW':
    case 'OCR_UNCERTAIN':
      bg = 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/10';
      icon = <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />;
      break;

    case 'READY':
    case 'IN_PROGRESS':
    case 'TESTING':
    case 'CALIBRATION':
    case 'MAINTENANCE':
      bg = 'bg-sky-50 text-sky-800 border-sky-200 ring-1 ring-sky-500/10';
      icon = <Clock className="h-3 w-3 text-sky-600 shrink-0" />;
      break;

    case 'SUBMITTED':
    case 'REVIEWED':
    case 'ISSUED':
      bg = 'bg-indigo-50 text-indigo-800 border-indigo-200 ring-1 ring-indigo-500/10';
      icon = <ShieldCheck className="h-3 w-3 text-indigo-600 shrink-0" />;
      break;

    case 'DRAFT':
    case 'PENDING':
    case 'INITIAL':
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
      icon = <Clock className="h-3 w-3 text-slate-500 shrink-0" />;
      break;

    case 'SIMULATION — NOT AN OFFICIAL RESULT':
      bg = 'bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-500/10';
      icon = <HelpCircle className="h-3 w-3 text-purple-600 shrink-0" />;
      break;

    case 'DEMO RULEPACK — NOT AUTHORITATIVE':
    case 'DEMO DATA — FOR DEMONSTRATION ONLY':
      bg = 'bg-amber-50 text-amber-900 border-amber-300 font-medium';
      icon = <ShieldAlert className="h-3 w-3 text-amber-700 shrink-0" />;
      break;

    default:
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
      icon = null;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-md border tracking-wide uppercase',
        padding,
        bg,
        className
      )}
    >
      {icon}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
}

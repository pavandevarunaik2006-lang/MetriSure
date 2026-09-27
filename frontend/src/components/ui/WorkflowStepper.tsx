import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FlaskConical, CheckCircle2, FileText, Play,
  BarChart3, ClipboardCheck, ShieldCheck, Award, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

interface WorkflowStepperProps {
  sessionId: number | string;
  sessionNumber?: string;
  currentStep?: 'SESSION' | 'READY' | 'PLAN' | 'EXECUTION' | 'RESULTS' | 'REVIEW' | 'APPROVAL' | 'REPORT';
  className?: string;
}

const steps = [
  { id: 'SESSION', label: 'SESSION', icon: FlaskConical, path: (id: string | number) => `/test-sessions/${id}` },
  { id: 'READY', label: 'READY', icon: CheckCircle2, path: (id: string | number) => `/test-ready/${id}` },
  { id: 'PLAN', label: 'PLAN', icon: FileText, path: (id: string | number) => `/test-plan/${id}` },
  { id: 'EXECUTION', label: 'EXECUTION', icon: Play, path: (id: string | number) => `/test-execution/${id}` },
  { id: 'RESULTS', label: 'RESULTS', icon: BarChart3, path: (id: string | number) => `/results/${id}` },
  { id: 'REVIEW', label: 'REVIEW', icon: ClipboardCheck, path: (id: string | number) => `/review/${id}` },
  { id: 'APPROVAL', label: 'APPROVAL', icon: ShieldCheck, path: (id: string | number) => `/approval/${id}` },
  { id: 'REPORT', label: 'REPORT', icon: Award, path: (id: string | number) => `/reports` },
];

export function WorkflowStepper({ sessionId, sessionNumber, currentStep, className }: WorkflowStepperProps) {
  const location = useLocation();

  // Auto-detect currentStep if not explicitly provided
  const detectStep = (): string => {
    if (currentStep) return currentStep;
    const path = location.pathname;
    if (path.includes('/test-ready')) return 'READY';
    if (path.includes('/test-plan')) return 'PLAN';
    if (path.includes('/test-execution')) return 'EXECUTION';
    if (path.includes('/results')) return 'RESULTS';
    if (path.includes('/review')) return 'REVIEW';
    if (path.includes('/approval')) return 'APPROVAL';
    if (path.includes('/reports')) return 'REPORT';
    return 'SESSION';
  };

  const activeId = detectStep();
  const currentIndex = steps.findIndex(s => s.id === activeId);

  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-xs p-3 overflow-x-auto', className)}>
      <div className="flex items-center justify-between min-w-[760px] gap-1">
        {steps.map((step, idx) => {
          const isActive = step.id === activeId;
          const isCompleted = idx < currentIndex;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <Link
                to={step.path(sessionId)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all select-none',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                )}
                title={`Go to ${step.label}`}
              >
                <div className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                )}>
                  {idx + 1}
                </div>
                <span className="tracking-wide text-[11px]">{step.label}</span>
              </Link>

              {idx < steps.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

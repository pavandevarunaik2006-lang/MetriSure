import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'violet';
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'neutral', children, dot = false, className }: BadgeProps) {
  const variants = {
    success: 'bg-[var(--color-emerald-500)]/10 text-[var(--color-emerald-600)]',
    warning: 'bg-[var(--color-amber-500)]/10 text-[var(--color-amber-600)]',
    error: 'bg-[var(--color-rose-500)]/10 text-[var(--color-rose-600)]',
    info: 'bg-[var(--color-navy-500)]/10 text-[var(--color-navy-700)]',
    neutral: 'bg-gray-100 text-gray-700',
    violet: 'bg-[var(--color-violet-500)]/10 text-[var(--color-violet-600)]',
  };

  const dotColors = {
    success: 'bg-[var(--color-emerald-500)]',
    warning: 'bg-[var(--color-amber-500)]',
    error: 'bg-[var(--color-rose-500)]',
    info: 'bg-[var(--color-navy-500)]',
    neutral: 'bg-gray-500',
    violet: 'bg-[var(--color-violet-500)]',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {dot && (
        <span className={cn('mr-1.5 h-2 w-2 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

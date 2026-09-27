import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
  noPadding?: boolean;
  onClick?: () => void;
}

export function Card({ title, subtitle, headerAction, footer, className, children, noPadding = false, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={cn('bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]', className)}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            {title && <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-6')}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border)] rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

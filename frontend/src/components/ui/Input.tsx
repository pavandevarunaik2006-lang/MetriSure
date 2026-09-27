import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-md border py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors',
              leftIcon ? 'pl-10' : '',
              error
                ? 'border-[var(--color-rose-500)] text-[var(--color-rose-600)] focus:ring-[var(--color-rose-500)]'
                : 'border-[var(--color-border-strong)] focus:border-[var(--color-navy-500)] focus:ring-[var(--color-navy-500)]',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-sm text-[var(--color-rose-500)]">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'violet';
  onClick?: () => void;
}

export function MetricCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', onClick }: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <Card 
      className={cn("hover:shadow-md transition-shadow", onClick ? "cursor-pointer" : "")} 
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-text-primary)]">{value}</p>
          {trend && trendLabel && (
            <div className="mt-2 flex items-center text-sm">
              <span className={cn(
                "font-medium",
                trend === 'up' ? 'text-[var(--color-emerald-600)]' : 
                trend === 'down' ? 'text-[var(--color-rose-600)]' : 'text-[var(--color-text-secondary)]'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

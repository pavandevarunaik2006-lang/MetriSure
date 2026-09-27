import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  section?: string;
}

export function PlaceholderPage({ title, section }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 mb-6">
          <Construction className="h-8 w-8 text-blue-500" />
        </div>
        
        {section && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 mb-3">
            {section}
          </span>
        )}
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          This module is part of the MetriSure platform and is being implemented as part of the 
          phased development plan. The architecture and data models are ready.
        </p>

        <div className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-medium text-amber-700 mb-8">
          <span className="mr-2 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Under Development
        </div>

        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

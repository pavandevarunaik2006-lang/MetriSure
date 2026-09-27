import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, ArrowLeft, Search, Check, 
  Scale, Calendar, User, Save, Play
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function TestSessionNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<number | null>(null);
  const [rulepack, setRulepack] = useState('1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instruments, setInstruments] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/instruments/')
      .then(res => {
        setInstruments(res.data.items || res.data);
      })
      .catch(err => console.error("Failed to fetch instruments", err));
  }, []);

  const filteredInstruments = instruments.filter(inst => 
    inst.status === 'APPROVED' || inst.status === 'ACTIVE'
  ).filter(inst => 
    inst.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inst.model?.model_name && inst.model.model_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstrument) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/test-sessions/', {
        instrument_id: selectedInstrument,
        laboratory_id: 1,
        rulepack_version: rulepack
      });
      navigate(`/test-sessions/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <button 
        onClick={() => navigate('/test-sessions')}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Test Sessions
      </button>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create Test Session</h1>
        <p className="mt-1 text-sm text-slate-500">Select an approved instrument and initiate a new type-evaluation sequence.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Instrument Selection */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
            <h2 className="text-lg font-semibold text-slate-900">Select Instrument</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by serial number or model..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredInstruments.map(inst => (
                <div 
                  key={inst.id}
                  onClick={() => setSelectedInstrument(inst.id)}
                  className={clsx(
                    'relative cursor-pointer rounded-xl border p-4 transition-all duration-200',
                    selectedInstrument === inst.id 
                      ? 'border-blue-600 bg-blue-50/50 shadow-[0_0_0_1px_rgba(37,99,235,1)]' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  )}
                >
                  {selectedInstrument === inst.id && (
                    <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      selectedInstrument === inst.id ? 'bg-blue-100' : 'bg-slate-100'
                    )}>
                      <Scale className={clsx('h-5 w-5', selectedInstrument === inst.id ? 'text-blue-600' : 'text-slate-500')} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{inst.model?.model_name || 'Unknown Model'}</p>
                      <p className="text-xs text-slate-500 mb-2">SN: {inst.serial_number} · {inst.model?.manufacturer || 'Unknown Mfr'}</p>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        Class {inst.model?.accuracy_class || '-'} · {inst.model?.max_capacity || '0'}{inst.model?.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredInstruments.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-sm text-slate-500">No approved instruments found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Configuration */}
        <div className={clsx(
          "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300",
          !selectedInstrument && "opacity-50 pointer-events-none grayscale-[50%]"
        )}>
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
              selectedInstrument ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
            )}>2</div>
            <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Operator</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Evaluation RulePack</label>
              <select 
                value={rulepack}
                onChange={e => setRulepack(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="1.0.0">OIML R-76:2006 (NAWI Type Evaluation) - DEMO v1.0</option>
              </select>
              <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                Note: Environmental conditions will be captured in the TestReady phase.
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
            <button
              type="submit"
              disabled={!selectedInstrument || isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Initialize Session
                </>
              )}
            </button>
          </div>
        </div>
        
      </form>
    </div>
  );
}

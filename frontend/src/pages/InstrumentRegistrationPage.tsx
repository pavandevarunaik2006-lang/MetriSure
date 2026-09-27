import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, ArrowLeft, Check, ChevronRight, Save, Shield, MapPin, 
  Settings2, Activity
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';

const steps = [
  { id: 'basics', title: 'Basic Information', icon: Scale },
  { id: 'specs', title: 'Technical Specs', icon: Settings2 },
  { id: 'lab', title: 'Laboratory Assignment', icon: MapPin },
  { id: 'review', title: 'Review & Register', icon: Shield },
];

export function InstrumentRegistrationPage() {
  const navigate = useNavigate();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    serial: '',
    accuracyClass: 'III',
    maxCapacity: '',
    minCapacity: '',
    e: '',
    d: '',
    unit: 'kg',
    lab: '',
    notes: ''
  });

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStepIdx !== steps.length - 1) {
      handleNext();
      return;
    }
    
    // Final submit
    setIsSubmitting(true);
    try {
      await apiClient.post('/instruments/', {
        model_id: 1,
        serial_number: formData.serial,
        laboratory_id: Number(formData.lab) || 1,
        year_of_manufacture: new Date().getFullYear(),
        notes: formData.notes || `Model: ${formData.model}, Mfr: ${formData.manufacturer}`
      });
      navigate('/instruments');
    } catch (err: any) {
      console.error("Failed to register instrument", err);
      alert(err.response?.data?.detail || "Failed to register instrument");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStepIdx].id) {
      case 'basics':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
              <input 
                type="text" 
                value={formData.manufacturer}
                onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. Sartorius AG"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model Name / Type</label>
              <input 
                type="text"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. Cubis II MCA"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
              <input 
                type="text"
                value={formData.serial}
                onChange={e => setFormData({...formData, serial: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. SN-987654321"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Accuracy Class</label>
              <select 
                value={formData.accuracyClass}
                onChange={e => setFormData({...formData, accuracyClass: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="I">Class I (Special Accuracy)</option>
                <option value="II">Class II (High Accuracy)</option>
                <option value="III">Class III (Medium Accuracy)</option>
                <option value="IIII">Class IIII (Ordinary Accuracy)</option>
              </select>
            </div>
          </div>
        );
      case 'specs':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measurement</label>
              <select 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="mg">mg (Milligram)</option>
                <option value="g">g (Gram)</option>
                <option value="kg">kg (Kilogram)</option>
                <option value="t">t (Tonne)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Capacity (Max)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={formData.maxCapacity}
                    onChange={e => setFormData({...formData, maxCapacity: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{formData.unit}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Capacity (Min)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={formData.minCapacity}
                    onChange={e => setFormData({...formData, minCapacity: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{formData.unit}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Interval (e)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={formData.e}
                    onChange={e => setFormData({...formData, e: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{formData.unit}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Interval (d)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={formData.d}
                    onChange={e => setFormData({...formData, d: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 p-2.5 pr-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{formData.unit}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Leave blank if d = e</p>
              </div>
            </div>
          </div>
        );
      case 'lab':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Laboratory</label>
              <select 
                value={formData.lab}
                onChange={e => setFormData({...formData, lab: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Select a laboratory...</option>
                <option value="1">National Metrology Lab, Mumbai</option>
                <option value="2">Regional Testing Lab, Delhi</option>
                <option value="3">State Metrology Lab, Bangalore</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Internal Reference / Notes</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                rows={4}
                placeholder="Any internal tracking notes..."
              />
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Instrument Overview</h4>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <div><dt className="text-slate-500">Manufacturer</dt><dd className="font-medium">{formData.manufacturer || '—'}</dd></div>
                <div><dt className="text-slate-500">Model</dt><dd className="font-medium">{formData.model || '—'}</dd></div>
                <div><dt className="text-slate-500">Serial Number</dt><dd className="font-medium">{formData.serial || '—'}</dd></div>
                <div><dt className="text-slate-500">Accuracy Class</dt><dd className="font-medium">Class {formData.accuracyClass || '—'}</dd></div>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Technical Specifications</h4>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <div><dt className="text-slate-500">Max Capacity</dt><dd className="font-medium">{formData.maxCapacity} {formData.unit}</dd></div>
                <div><dt className="text-slate-500">Min Capacity</dt><dd className="font-medium">{formData.minCapacity} {formData.unit}</dd></div>
                <div><dt className="text-slate-500">Verification Interval (e)</dt><dd className="font-medium">{formData.e} {formData.unit}</dd></div>
                <div><dt className="text-slate-500">Actual Interval (d)</dt><dd className="font-medium">{formData.d || formData.e} {formData.unit}</dd></div>
              </dl>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <button 
        onClick={() => navigate('/instruments')}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Instruments
      </button>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Register New Instrument</h1>
        <p className="mt-1 text-sm text-slate-500">Enter details to register a new NAWI for type evaluation.</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-[#f8fafc] px-2">
                <div className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300',
                  isCompleted ? 'border-blue-600 bg-blue-600 text-white' :
                  isCurrent ? 'border-blue-600 bg-white text-blue-600' :
                  'border-slate-300 bg-white text-slate-400'
                )}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className={clsx(
                  'text-xs font-medium',
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Area */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{steps[currentStepIdx].title}</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {renderStepContent()}
          </div>
          
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIdx === 0 || isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : currentStepIdx === steps.length - 1 ? (
                <>
                  <Save className="h-4 w-4" />
                  Register
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

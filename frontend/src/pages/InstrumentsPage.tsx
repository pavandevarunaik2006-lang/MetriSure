import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale, Plus, Search, Filter, RefreshCw, ChevronRight, ShieldCheck, Building2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';

interface BackendInstrument {
  id: number;
  serial_number: string;
  year_of_manufacture?: number;
  status: string;
  notes?: string;
  model: {
    manufacturer_name: string;
    model_name: string;
    accuracy_class: string;
    max_capacity: number;
    min_capacity?: number;
    verification_interval_e?: number;
    actual_interval_d?: number;
    unit: string;
  };
  laboratory?: {
    id: number;
    name: string;
    code?: string;
  };
}

export function InstrumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [instruments, setInstruments] = useState<BackendInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchInstruments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/instruments/');
      const items = Array.isArray(res.data?.items) ? res.data.items : (Array.isArray(res.data) ? res.data : []);
      setInstruments(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load instruments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, []);

  const filteredInstruments = (instruments || []).filter((inst) => {
    if (!inst) return false;
    if (statusFilter !== 'ALL' && inst.status !== statusFilter) return false;
    if (classFilter !== 'ALL' && inst.model?.accuracy_class !== classFilter) return false;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const sn = (inst.serial_number || '').toLowerCase();
      const model = (inst.model?.model_name || '').toLowerCase();
      const mfr = (inst.model?.manufacturer_name || '').toLowerCase();
      const lab = (inst.laboratory?.name || '').toLowerCase();
      return sn.includes(term) || model.includes(term) || mfr.includes(term) || lab.includes(term);
    }
    return true;
  });

  const getClassBadgeStyle = (accClass: string) => {
    switch (accClass) {
      case 'I': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'II': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'III': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'IIII': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              National NAWI Registry
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Non-Automatic Weighing Instruments under OIML R-76</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-indigo-600" />
            Registered Instruments
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Registered Instruments subject to metrological type evaluation and pattern approval.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/instruments/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Register Instrument
          </button>
          <button
            onClick={fetchInstruments}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh instruments list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by serial #, manufacturer, model, or lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="TESTING">TESTING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="RETIRED">RETIRED</option>
            </select>

            {/* Accuracy Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Accuracy Classes</option>
              <option value="I">Class I (Special)</option>
              <option value="II">Class II (High)</option>
              <option value="III">Class III (Medium)</option>
              <option value="IIII">Class IIII (Ordinary)</option>
            </select>

            {(statusFilter !== 'ALL' || classFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => { setStatusFilter('ALL'); setClassFilter('ALL'); setSearchTerm(''); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-xs">Loading registered NAWI instruments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        ) : filteredInstruments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Serial Number</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Model / Manufacturer</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Max Capacity (Max)</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Scale Interval (e)</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Laboratory</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstruments.map((inst) => (
                  <tr
                    key={inst.id}
                    onClick={() => navigate(`/instruments/${inst.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {inst.serial_number}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID #{inst.id}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{inst.model?.model_name || 'Standard Balance'}</div>
                      <div className="text-[11px] text-slate-500">{inst.model?.manufacturer_name || 'Generic Metrology'}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${getClassBadgeStyle(inst.model?.accuracy_class || 'III')}`}>
                        Class {inst.model?.accuracy_class || 'III'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-semibold text-slate-800">
                      {inst.model?.max_capacity !== undefined ? `${inst.model.max_capacity} ${inst.model.unit || 'kg'}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-600">
                      {inst.model?.verification_interval_e !== undefined ? `${inst.model.verification_interval_e} ${inst.model.unit || 'kg'}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{inst.laboratory?.name || 'Metrology Lab #1'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={inst.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium">
                      <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800">
                        Details <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            <Scale className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No instruments matched your search criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or keyword.</p>
          </div>
        )}

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredInstruments.length} of {instruments.length} registered instruments</span>
          <span className="font-mono text-[11px]">OIML R-76 Metrological Pattern Registry</span>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-center">
        <p className="text-xs font-semibold text-amber-800">
          DEMO DATA — FOR DEMONSTRATION ONLY
        </p>
      </div>
    </div>
  );
}

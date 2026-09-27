import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, CheckCircle, Clock, Edit2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface Laboratory {
  id: number;
  name: string;
  code: string;
  address: string;
  contact_person?: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
}

export function LaboratoriesPage() {
  const { hasRole } = useAuth();
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit / Add Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    address: string;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    is_active: boolean;
  }>({
    name: '',
    code: '',
    address: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/laboratories/');
      setLabs(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load laboratories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleOpenEdit = (lab: Laboratory) => {
    setEditingLab(lab);
    setModalMode('edit');
    setFormData({
      name: lab.name || '',
      code: lab.code || '',
      address: lab.address || '',
      contact_person: lab.contact_person || '',
      contact_email: lab.contact_email || '',
      contact_phone: lab.contact_phone || '',
      is_active: lab.is_active ?? true,
    });
    setSaveError(null);
  };

  const handleOpenCreate = () => {
    setEditingLab(null);
    setModalMode('create');
    setFormData({
      name: '',
      code: '',
      address: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    });
    setSaveError(null);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingLab(null);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setSaveError('Laboratory Name is required');
      return;
    }
    if (!formData.code.trim()) {
      setSaveError('Facility Code is required');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (modalMode === 'edit' && editingLab) {
        const response = await apiClient.put(`/laboratories/${editingLab.id}`, {
          name: formData.name.trim(),
          code: formData.code.trim(),
          address: formData.address.trim(),
          contact_person: formData.contact_person.trim(),
          contact_email: formData.contact_email.trim(),
          contact_phone: formData.contact_phone.trim(),
          is_active: formData.is_active,
        });

        setLabs((prev) =>
          prev.map((l) => (l.id === editingLab.id ? { ...l, ...response.data } : l))
        );
        setSaveSuccess(`Laboratory "${formData.name}" updated successfully.`);
      } else if (modalMode === 'create') {
        const response = await apiClient.post('/laboratories/', {
          name: formData.name.trim(),
          code: formData.code.trim(),
          address: formData.address.trim(),
          contact_person: formData.contact_person.trim(),
          contact_email: formData.contact_email.trim(),
          contact_phone: formData.contact_phone.trim(),
          is_active: formData.is_active,
        });

        setLabs((prev) => [...prev, response.data]);
        setSaveSuccess(`Laboratory "${formData.name}" created successfully.`);
      }

      setTimeout(() => setSaveSuccess(null), 4000);
      handleCloseModal();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save laboratory details.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredLabs = labs.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratories</h1>
          <p className="mt-1 text-sm text-slate-500">Manage registered testing facilities and their details.</p>
        </div>
        {hasRole('ADMINISTRATOR') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Laboratory
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by laboratory name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab) => (
            <div key={lab.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                    <Building2 className="h-3 w-3" /> {lab.code}
                  </span>
                  {lab.is_active ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <Clock className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 leading-tight">{lab.name}</h3>
              </div>
              <div className="p-4 flex-1 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <p>{lab.address || 'Address not registered'}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Contact</p>
                  <p>{lab.contact_email || 'No email'}</p>
                  <p>{lab.contact_phone || 'No phone'}</p>
                </div>
              </div>
              {hasRole('ADMINISTRATOR') && (
                <div className="bg-slate-50 border-t border-slate-100 p-3 text-right">
                  <button
                    onClick={() => handleOpenEdit(lab)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Details
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredLabs.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No laboratories found.
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Laboratory Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {modalMode === 'edit' ? 'Edit Laboratory Details' : 'Add New Laboratory'}
                </h3>
                {editingLab && (
                  <p className="text-xs text-slate-500 mt-0.5">Facility ID: {editingLab.id} &middot; Code: {editingLab.code}</p>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {saveError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 leading-relaxed">{saveError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Facility Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={saving}
                    placeholder="e.g. Regional Metrology Lab"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Facility Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={saving}
                    placeholder="e.g. RML-CHE"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Facility Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  disabled={saving}
                  placeholder="Street, City, State"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    disabled={saving}
                    placeholder="lab@domain.gov"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    disabled={saving}
                    placeholder="+91-..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={saving}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">Operational Facility</span>
                    <p className="text-xs text-slate-500">Enable this testing facility for active test session assignments</p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

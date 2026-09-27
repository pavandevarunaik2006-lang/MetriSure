import { useState, useEffect } from 'react';
import { Settings, Save, Shield, HardDrive, Bell, Loader2, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface SystemSettingsData {
  org_name: string;
  timezone: string;
  environment: string;
  require_mfa_approvers: boolean;
  enforce_password_rotation: boolean;
  email_notifications: boolean;
  dashboard_alerts: boolean;
  notification_email: string;
}

const DEFAULT_SETTINGS: SystemSettingsData = {
  org_name: 'National Metrology Institute',
  timezone: 'UTC (Coordinated Universal Time)',
  environment: 'Production',
  require_mfa_approvers: true,
  enforce_password_rotation: true,
  email_notifications: true,
  dashboard_alerts: true,
  notification_email: 'alerts@metrisure.demo',
};

export function SettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMINISTRATOR');

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'rulepacks' | 'notifications'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Original settings as loaded from backend (for Cancel / Discard)
  const [initialSettings, setInitialSettings] = useState<SystemSettingsData>(DEFAULT_SETTINGS);
  // Form settings being edited
  const [settingsData, setSettingsData] = useState<SystemSettingsData>(DEFAULT_SETTINGS);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/');
      const merged: SystemSettingsData = {
        ...DEFAULT_SETTINGS,
        ...response.data,
      };
      setInitialSettings(merged);
      setSettingsData(merged);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.response?.data?.detail || 'Failed to load system settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleDiscard = () => {
    setSettingsData(initialSettings);
    setSaveError(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      setSaveError('Administrator privileges are required to modify system settings.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await apiClient.put('/settings/', settingsData);
      const updated: SystemSettingsData = {
        ...DEFAULT_SETTINGS,
        ...response.data,
      };
      setInitialSettings(updated);
      setSettingsData(updated);
      setSaveSuccess('System settings saved successfully. Audit trail record created.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update settings.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = JSON.stringify(initialSettings) !== JSON.stringify(settingsData);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage MetriSure platform configuration and compliance parameters.</p>
        </div>
        {!isAdmin && (
          <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800">
            Read-Only (Admin required to edit)
          </span>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {saveError && (
        <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-rose-600 hover:text-rose-800">
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <p>{loadError}</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings className="h-4 w-4" /> General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="h-4 w-4" /> Security & Audit
            </button>
            <button
              onClick={() => setActiveTab('rulepacks')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'rulepacks' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HardDrive className="h-4 w-4" /> RulePacks
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="h-4 w-4" /> Notifications
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">General Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={settingsData.org_name}
                      onChange={(e) => setSettingsData({ ...settingsData, org_name: e.target.value })}
                      disabled={!isAdmin || saving}
                      className="w-full max-w-md rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Timezone</label>
                    <select
                      value={settingsData.timezone}
                      onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
                      disabled={!isAdmin || saving}
                      className="w-full max-w-md rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                      <option value="IST (Indian Standard Time)">IST (Indian Standard Time)</option>
                      <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</option>
                      <option value="CET (Central European Time)">CET (Central European Time)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">System Environment</label>
                    <input
                      type="text"
                      value={settingsData.environment}
                      disabled
                      className="w-full max-w-md rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Discard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Security & Audit</h2>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-800">Application Audit Trail is Active</p>
                  <p className="text-xs text-amber-700 mt-1">
                    All type evaluation actions, compliance checks, and administrative updates are securely logged to the recorded ledger.
                  </p>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.require_mfa_approvers}
                      onChange={(e) => setSettingsData({ ...settingsData, require_mfa_approvers: e.target.checked })}
                      disabled={!isAdmin || saving}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Require MFA for Approvers</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.enforce_password_rotation}
                      onChange={(e) => setSettingsData({ ...settingsData, enforce_password_rotation: e.target.checked })}
                      disabled={!isAdmin || saving}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Enforce password rotation every 90 days</span>
                  </label>
                </div>

                {isAdmin && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Discard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rulepacks' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">RulePacks</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">OIML R-76-1:2006</p>
                      <p className="text-xs text-slate-500">v1.0.0 &middot; Class I, II, III, IIII</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 opacity-60">
                    <div>
                      <p className="text-sm font-medium text-slate-900">OIML R-76-1:1992</p>
                      <p className="text-xs text-slate-500">v0.9.5 &middot; Legacy</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      Retired
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Notifications</h2>
                <p className="text-sm text-slate-500">Manage email and dashboard alert preferences.</p>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.email_notifications}
                      onChange={(e) => setSettingsData({ ...settingsData, email_notifications: e.target.checked })}
                      disabled={!isAdmin || saving}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Email Notifications for Review/Approval Events</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.dashboard_alerts}
                      onChange={(e) => setSettingsData({ ...settingsData, dashboard_alerts: e.target.checked })}
                      disabled={!isAdmin || saving}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Display Dashboard Alert Banners</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Administrative Alert Recipient Email</label>
                    <input
                      type="email"
                      value={settingsData.notification_email}
                      onChange={(e) => setSettingsData({ ...settingsData, notification_email: e.target.value })}
                      disabled={!isAdmin || saving}
                      className="w-full max-w-md rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Discard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, Save } from 'lucide-react';
import { api, extractApiError } from '../../services/api';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    site_name: 'Casid Pharma',
    support_email: 'enquiries@casidpharma.com',
    maintenance_mode: 'false',
    enquiry_retention_days: '365',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => {
        if (res.data?.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      })
      .catch((err) => setError(extractApiError(err, 'Failed to load settings.')))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.put('/admin/settings', { settings });
      setNotice('System settings saved successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportBackup() {
    setError('');
    setNotice('');
    try {
      const res = await api.get('/admin/backup/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casid-pharma-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice('Database backup snapshot exported and downloaded.');
    } catch (err) {
      setError(extractApiError(err, 'Backup export failed.'));
    }
  }

  async function handleRestoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setNotice('');
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.post('/admin/backup/restore', parsed);
      setNotice('Database backup snapshot restored successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Invalid backup file or restore failure.'));
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading system settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Backup &amp; System Maintenance</h1>
        <p className="text-sm text-slate-600">
          Configure global portal settings, retention policy, and database backup/restore snapshots.
        </p>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      {/* System Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-slate-900">Portal Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Corporate Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Primary Enquiry Email</label>
            <input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Enquiry Retention (Days)</label>
            <input
              type="number"
              min={30}
              max={3650}
              value={settings.enquiry_retention_days}
              onChange={(e) => setSettings({ ...settings, enquiry_retention_days: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Public Maintenance Flag</label>
            <select
              value={settings.maintenance_mode}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
            >
              <option value="false">Normal Operation (Public Live)</option>
              <option value="true">Maintenance Notice Enabled</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </form>

      {/* Database Backup & Restore */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">Database Backup &amp; Restoration</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Export a complete, portable JSON snapshot of categories, products, CMS pages, news articles, media metadata,
          enquiries, and system settings. Restore executes inside an atomic database transaction.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download Full Backup (.json)</span>
          </button>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{restoring ? 'Restoring Snapshot...' : 'Restore from Backup (.json)'}</span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleRestoreBackup}
              disabled={restoring}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

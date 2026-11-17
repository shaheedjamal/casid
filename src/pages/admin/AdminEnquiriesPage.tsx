import { useEffect, useState } from 'react';
import { Eye, Search, Trash2, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { useAuth } from '../../hooks/useAuth';
import type { Enquiry, EnquiryStatus } from '../../types';

export function AdminEnquiriesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>('pending');
  const [saving, setSaving] = useState(false);

  async function loadEnquiries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/enquiries?${params.toString()}`);
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load enquiries.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEnquiries();
  }, [search, statusFilter]);

  function openInspector(e: Enquiry) {
    setSelected(e);
    setAdminNotes(e.admin_notes || '');
    setNextStatus(e.status);
  }

  async function handleUpdateEnquiry(statusOverride?: EnquiryStatus) {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const targetStatus = statusOverride || nextStatus;
      await api.put(`/enquiries/${selected.id}`, {
        status: targetStatus,
        admin_notes: adminNotes,
      });
      setNotice(`Enquiry ${selected.reference_code} marked as ${targetStatus}.`);
      setSelected(null);
      await loadEnquiries();
    } catch (err) {
      setError(extractApiError(err, 'Failed to update enquiry.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: Enquiry) {
    setError('');
    try {
      await api.delete(`/enquiries/${e.id}`);
      setNotice(`Deleted enquiry ${e.reference_code} per retention policy.`);
      if (selected?.id === e.id) setSelected(null);
      await loadEnquiries();
    } catch (err) {
      setError(extractApiError(err, 'Failed to delete enquiry.'));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Enquiry Management</h1>
        <p className="text-sm text-slate-600">
          Review incoming hospital, partner, and product enquiries submitted from the public contact portal.
        </p>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference code, sender, company, or subject..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="responded">Responded</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Ref Code</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading enquiries...
                </td>
              </tr>
            ) : enquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No enquiry records match your filters.
                </td>
              </tr>
            ) : (
              enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-800 whitespace-nowrap">
                    {e.reference_code}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-700">{e.subject}</td>
                  <td className="px-4 py-3">
                    <StatusText status={e.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(e.created_at + (e.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openInspector(e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Inspect</span>
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(e)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          aria-label={`Delete ${e.reference_code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enquiry Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-lg font-bold text-slate-900 font-mono">{selected.reference_code}</h2>
                <StatusText status={selected.status} />
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-200 rounded-md p-4">
                <div>
                  <p className="text-xs text-slate-500">Sender</p>
                  <p className="font-medium text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-600">{selected.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Organization &amp; Phone</p>
                  <p className="font-medium text-slate-900">{selected.company || '—'}</p>
                  <p className="text-xs font-mono text-slate-600">{selected.phone || '—'}</p>
                </div>
                {selected.product_name && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Referenced Formulation</p>
                    <p className="font-medium text-blue-800">{selected.product_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</p>
                <p className="text-base font-semibold text-slate-900">{selected.subject}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200 rounded-md p-4">
                  {selected.message}
                </p>
              </div>

              {isSuperAdmin && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Internal Admin Notes</label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                      placeholder="Record follow-up actions, dossier dispatch date, or QA ticket number..."
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'reviewed', 'responded', 'closed'] as EnquiryStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={saving}
                          onClick={() => handleUpdateEnquiry(st)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                            selected.status === st
                              ? 'bg-blue-800 text-white border-blue-800'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Mark {st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

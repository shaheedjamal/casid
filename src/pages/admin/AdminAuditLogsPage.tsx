import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import type { AuditLog } from '../../types';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (entityType !== 'all') params.set('entity_type', entityType);

    api
      .get(`/admin/audit-logs?${params.toString()}`)
      .then((res) => setLogs(res.data.logs || []))
      .catch((err) => setError(extractApiError(err, 'Failed to load audit logs.')))
      .finally(() => setLoading(false));
  }, [search, entityType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Security &amp; Activity Audit Logs</h1>
        <p className="text-sm text-slate-600">
          Immutable chronological record of authentication events, content mutations, and system maintenance actions.
        </p>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor email, action, or details..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
        >
          <option value="all">All Entities</option>
          <option value="auth">Authentication</option>
          <option value="product">Products</option>
          <option value="category">Categories</option>
          <option value="page">CMS Pages</option>
          <option value="news">News</option>
          <option value="media">Media</option>
          <option value="enquiry">Enquiries</option>
          <option value="user">Users</option>
          <option value="system">System / Backup</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Timestamp (UTC)</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No audit entries match your search.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {log.created_at}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{log.user_email}</td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-md">{log.details}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{log.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

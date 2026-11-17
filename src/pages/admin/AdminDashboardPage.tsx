import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { useAuth } from '../../hooks/useAuth';
import type { DashboardData } from '../../types';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(extractApiError(err, 'Failed to load dashboard metrics.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
        {error || 'Dashboard metrics unavailable.'}
      </div>
    );
  }

  const s = data.stats;
  const kpis = [
    { label: 'Total Products', value: s.totalProducts, sub: `${s.publishedProducts} published`, to: '/admin/products' },
    { label: 'Categories', value: s.totalCategories, sub: 'Therapeutic lines', to: user?.role === 'super_admin' ? '/admin/categories' : '/admin/products' },
    { label: 'Published Pages', value: s.publishedPages, sub: `${s.totalPages} total CMS pages`, to: '/admin/pages' },
    { label: 'News Articles', value: s.totalNews, sub: `${s.publishedNews} published`, to: '/admin/news' },
    { label: 'Enquiries', value: s.totalEnquiries, sub: `${s.pendingEnquiries} pending`, to: '/admin/enquiries' },
    { label: 'Admin Users', value: s.totalUsers, sub: `${s.totalMedia} media assets`, to: user?.role === 'super_admin' ? '/admin/users' : '/admin/media' },
  ];

  const summarizeStatus = (rows: Array<{ status: string; count: number }>) => {
    const map: Record<string, number> = { published: 0, pending_review: 0, draft: 0, archived: 0 };
    for (const r of rows) map[r.status] = r.count;
    return map;
  };

  const prodStats = summarizeStatus(data.contentStatus.products);
  const pageStats = summarizeStatus(data.contentStatus.pages);
  const newsStats = summarizeStatus(data.contentStatus.news);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Operations Overview</h1>
          <p className="text-sm text-slate-600">
            Real-time database summary for Casid Pharma public content, enquiries, and audit activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="px-4 py-2 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/news"
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap"
          >
            Post News
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className="bg-white border border-slate-200 hover:border-blue-700/50 rounded-lg p-4 transition-colors"
          >
            <p className="text-xs text-slate-500 truncate">{kpi.label}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-500 truncate">{kpi.sub}</p>
          </Link>
        ))}
      </div>

      {/* Content Status Summary */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">Content Publishing Status</h2>
          <span className="text-xs font-mono text-slate-500">
            {s.pendingApprovals} awaiting approval
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3 text-right">Published</th>
                <th className="px-5 py-3 text-right">Pending Approval</th>
                <th className="px-5 py-3 text-right">Draft</th>
                <th className="px-5 py-3 text-right">Archived</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-5 py-3.5 font-medium text-slate-900">Products</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-emerald-700">{prodStats.published}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-amber-700">{prodStats.pending_review}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">{prodStats.draft}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-rose-700">{prodStats.archived}</td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-medium text-slate-900">CMS Pages</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-emerald-700">{pageStats.published}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-amber-700">{pageStats.pending_review}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">{pageStats.draft}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-rose-700">{pageStats.archived}</td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-medium text-slate-900">News Articles</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-emerald-700">{newsStats.published}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-amber-700">{newsStats.pending_review}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">{newsStats.draft}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-rose-700">{newsStats.archived}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Enquiries & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">Recent Enquiries</h2>
            <Link to="/admin/enquiries" className="text-xs font-medium text-blue-800 hover:underline">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {data.recentEnquiries.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No enquiries recorded yet.</p>
            ) : (
              data.recentEnquiries.map((enq) => (
                <div key={enq.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{enq.subject}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {enq.name} · <span className="font-mono">{enq.reference_code}</span>
                    </p>
                  </div>
                  <StatusText status={enq.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">Recent Activity</h2>
            {user?.role === 'super_admin' && (
              <Link to="/admin/audit-logs" className="text-xs font-medium text-blue-800 hover:underline">
                Full Audit Log →
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-200">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-blue-800">{log.action}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(log.created_at + (log.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{log.details}</p>
                <p className="text-[11px] text-slate-400">{log.user_email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

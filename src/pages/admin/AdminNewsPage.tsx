import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { ResilientImage } from '../../components/ResilientImage';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useAuth } from '../../hooks/useAuth';
import type { ContentStatus, NewsArticle } from '../../types';

export function AdminNewsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('Corporate Announcement');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  async function loadNews() {
    setLoading(true);
    try {
      const res = await api.get('/news?scope=admin');
      setArticles(res.data.news || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load news articles.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNews();
  }, []);

  function openCreate() {
    setEditingId(null);
    setTitle('');
    setCategoryLabel('Corporate Announcement');
    setSummary('');
    setContent('');
    setImageUrl('/src/assets/images/news_qc_laboratory_1794888601901.jpg');
    setPublishedAt(new Date().toISOString().slice(0, 10));
    setStatus(isSuperAdmin ? 'published' : 'draft');
    setModalOpen(true);
  }

  function openEdit(a: NewsArticle) {
    setEditingId(a.id);
    setTitle(a.title);
    setCategoryLabel(a.category_label);
    setSummary(a.summary);
    setContent(a.content);
    setImageUrl(a.image_url);
    setPublishedAt(a.published_at ? a.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setStatus(a.status);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError('Title, summary, and article content are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category_label: categoryLabel.trim(),
        summary: summary.trim(),
        content: content.trim(),
        image_url: imageUrl.trim(),
        published_at: `${publishedAt}T09:00:00Z`,
        status,
      };
      if (editingId) {
        await api.put(`/news/${editingId}`, payload);
        setNotice(`Updated article "${title}".`);
      } else {
        await api.post('/news', payload);
        setNotice(`Created article "${title}".`);
      }
      setModalOpen(false);
      await loadNews();
    } catch (err) {
      setError(extractApiError(err, 'Failed to save news article.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: NewsArticle) {
    setError('');
    try {
      await api.delete(`/news/${a.id}`);
      setNotice(`Deleted article "${a.title}".`);
      await loadNews();
    } catch (err) {
      setError(extractApiError(err, 'Failed to delete news article.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">News &amp; Announcements</h1>
          <p className="text-sm text-slate-600">
            Publish corporate announcements, R&amp;D milestones, and facility updates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add News Article</span>
        </button>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3">Article</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Publication Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading articles...
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                        <ResilientImage src={a.image_url} alt={a.title} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium text-slate-900 line-clamp-1">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{a.category_label}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    {new Date(a.published_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusText status={a.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        aria-label={`Edit ${a.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(a)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                          aria-label={`Delete ${a.title}`}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {editingId ? 'Edit News Article' : 'Create News Article'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category Label</label>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Submit for Approval</option>
                    {isSuperAdmin && <option value="published">Published</option>}
                    {isSuperAdmin && <option value="archived">Archived</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Article Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Media Library
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Article Content *</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md"
                >
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setImageUrl(url)}
      />
    </div>
  );
}

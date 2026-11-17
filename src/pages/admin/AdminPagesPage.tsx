import React, { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useAuth } from '../../hooks/useAuth';
import type { CmsPage, ContentStatus } from '../../types';

export function AdminPagesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [contentJsonText, setContentJsonText] = useState('{}');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<CmsPage | null>(null);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await api.get('/pages?scope=admin');
      setPages(res.data.pages || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load CMS pages.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPages();
  }, []);

  function openEdit(page: CmsPage) {
    setIsCreating(false);
    setEditingPage(page);
    setSlug(page.slug);
    setTitle(page.title);
    setSubtitle(page.subtitle);
    setHeroImageUrl(page.hero_image_url);
    setMetaDescription(page.meta_description);
    setContentJsonText(JSON.stringify(page.content || {}, null, 2));
    setStatus(page.status);
    setError('');
  }

  function openCreate() {
    setIsCreating(true);
    setEditingPage(null);
    setSlug('');
    setTitle('');
    setSubtitle('');
    setHeroImageUrl('');
    setMetaDescription('');
    setContentJsonText('{\n  "overview": ""\n}');
    setStatus(isSuperAdmin ? 'published' : 'draft');
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');

    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(contentJsonText);
    } catch {
      setError('Structured Page Content must be valid JSON.');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        await api.post('/pages', {
          slug: slug.trim(),
          title: title.trim(),
          subtitle: subtitle.trim(),
          hero_image_url: heroImageUrl.trim(),
          meta_description: metaDescription.trim(),
          content: parsedContent,
          status,
        });
        setNotice(`Created CMS page "${title}".`);
      } else if (editingPage) {
        await api.put(`/pages/${editingPage.id}`, {
          title: title.trim(),
          subtitle: subtitle.trim(),
          hero_image_url: heroImageUrl.trim(),
          meta_description: metaDescription.trim(),
          content: parsedContent,
          status,
        });
        setNotice(`Updated CMS page "/${editingPage.slug}".`);
      }
      setEditingPage(null);
      setIsCreating(false);
      await loadPages();
    } catch (err) {
      setError(extractApiError(err, 'Failed to save CMS page.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">CMS Page Management</h1>
          <p className="text-sm text-slate-600">
            Edit corporate page copy, R&amp;D updates, quality records, contact details, and legal policies directly.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Create Page</span>
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
              <th className="px-5 py-3">Page Title</th>
              <th className="px-5 py-3">Route Slug</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading CMS pages...
                </td>
              </tr>
            ) : (
              pages.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.title}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">/{p.slug}</td>
                  <td className="px-5 py-3.5">
                    <StatusText status={p.status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                    {new Date(p.updated_at + (p.updated_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPage(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Modal */}
      {(editingPage || isCreating) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {isCreating ? 'Create New CMS Page' : `Edit Page: /${editingPage?.slug}`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingPage(null);
                  setIsCreating(false);
                }}
                className="p-1.5 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              {isCreating && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Page Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. careers"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Publication Status</label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle / Lead Copy</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hero Banner Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaOpen(true)}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                    >
                      Pick Image
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SEO Meta Description</label>
                  <input
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Structured Section Content (JSON)
                </label>
                <textarea
                  rows={10}
                  value={contentJsonText}
                  onChange={(e) => setContentJsonText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPage(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md"
                >
                  {saving ? 'Saving...' : 'Save Page Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-base font-bold text-slate-900">Content Preview: /{previewPage.slug}</h3>
                <StatusText status={previewPage.status} />
              </div>
              <button type="button" onClick={() => setPreviewPage(null)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <h1 className="font-display text-2xl font-bold text-slate-900">{previewPage.title}</h1>
              <p className="text-sm text-slate-600">{previewPage.subtitle}</p>
              <pre className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 overflow-x-auto">
                {JSON.stringify(previewPage.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setHeroImageUrl(url)}
      />
    </div>
  );
}

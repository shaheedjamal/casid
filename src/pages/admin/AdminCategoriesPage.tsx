import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import type { Category } from '../../types';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const [reassignCategory, setReassignCategory] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<number>(0);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await api.get('/categories?scope=admin');
      setCategories(res.data.categories || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load categories.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function openCreate() {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setStatus('active');
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description);
    setImageUrl(c.image_url);
    setStatus(c.status);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), image_url: imageUrl.trim(), status };
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setNotice(`Updated category "${name}".`);
      } else {
        await api.post('/categories', payload);
        setNotice(`Created category "${name}".`);
      }
      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      setError(extractApiError(err, 'Failed to save category.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    setError('');
    setNotice('');
    try {
      await api.delete(`/categories/${c.id}`);
      setNotice(`Deleted category "${c.name}".`);
      await loadCategories();
    } catch (err) {
      const msg = extractApiError(err, 'Unable to delete category.');
      if ((c.total_product_count || 0) > 0) {
        const other = categories.find((cat) => cat.id !== c.id);
        setReassignCategory(c);
        setReassignTargetId(other?.id || 0);
      } else {
        setError(msg);
      }
    }
  }

  async function handleReassignAndDelete() {
    if (!reassignCategory || !reassignTargetId) return;
    setError('');
    try {
      const res = await api.delete(`/categories/${reassignCategory.id}?reassignTo=${reassignTargetId}`);
      setNotice(res.data.message);
      setReassignCategory(null);
      await loadCategories();
    } catch (err) {
      setError(extractApiError(err, 'Reassignment failed.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Category Management</h1>
          <p className="text-sm text-slate-600">
            Organize therapeutic product categories. Categories with active products require reassignment before deletion.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Category</span>
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
              <th className="px-5 py-3">Category Name</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right">Products</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-md truncate">{c.description}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-900">
                    {c.total_product_count ?? c.product_count ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusText status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {editingId ? 'Edit Category' : 'Add Category'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category Image URL</label>
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
                    Pick Image
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Deletion / Reassignment Modal */}
      {reassignCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Category In Use</h3>
            <p className="text-sm text-slate-600">
              <strong>{reassignCategory.name}</strong> is currently assigned to{' '}
              <span className="font-mono font-semibold">{reassignCategory.total_product_count}</span> product(s).
              Select a replacement category to reassign those products before deleting:
            </p>
            <select
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
            >
              {categories
                .filter((c) => c.id !== reassignCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignCategory(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignAndDelete}
                disabled={!reassignTargetId}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-md"
              >
                Reassign &amp; Delete
              </button>
            </div>
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

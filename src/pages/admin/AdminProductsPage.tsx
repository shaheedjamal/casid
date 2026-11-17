import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import { ResilientImage } from '../../components/ResilientImage';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useAuth } from '../../hooks/useAuth';
import type { Category, ContentStatus, Product } from '../../types';

const EMPTY_FORM = {
  name: '',
  sku: '',
  category_id: 0,
  dosage_form: '',
  strength: '',
  therapeutic_area: '',
  short_description: '',
  description: '',
  composition: '',
  packaging_info: '',
  storage_conditions: '',
  image_url: '',
  is_featured: false,
  status: 'draft' as ContentStatus,
};

export function AdminProductsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ scope: 'admin' });
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/categories?scope=admin'),
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load products.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [search, categoryFilter, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id || 0,
      status: isSuperAdmin ? 'published' : 'draft',
    });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category_id: p.category_id,
      dosage_form: p.dosage_form,
      strength: p.strength,
      therapeutic_area: p.therapeutic_area,
      short_description: p.short_description,
      description: p.description,
      composition: p.composition,
      packaging_info: p.packaging_info,
      storage_conditions: p.storage_conditions,
      image_url: p.image_url,
      is_featured: Boolean(p.is_featured),
      status: p.status,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.sku.trim() || !form.category_id) {
      setFormError('Product name, SKU, and category are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setNotice(`Updated "${form.name}".`);
      } else {
        await api.post('/products', payload);
        setNotice(`Created "${form.name}".`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(extractApiError(err, 'Unable to save product.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatus(p: Product, nextStatus: ContentStatus) {
    setError('');
    setNotice('');
    try {
      await api.put(`/products/${p.id}`, { status: nextStatus });
      setNotice(`"${p.name}" updated to ${nextStatus.replace('_', ' ')}.`);
      await loadData();
    } catch (err) {
      setError(extractApiError(err, 'Status update failed.'));
    }
  }

  async function handleDelete(p: Product) {
    setError('');
    setNotice('');
    try {
      await api.delete(`/products/${p.id}`);
      setNotice(`Deleted product "${p.name}".`);
      await loadData();
    } catch (err) {
      setError(extractApiError(err, 'Failed to delete product.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Product Management</h1>
          <p className="text-sm text-slate-600">
            Manage pharmaceutical formulations, specifications, category assignments, and publication status.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Product</span>
        </button>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="pending_review">Pending Approval</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Form &amp; Strength</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No products match the current filter criteria.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                        <ResilientImage src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.is_featured ? 'Featured on Home' : p.therapeutic_area}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-700">{p.category_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {p.dosage_form} · <span className="font-mono">{p.strength}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusText status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isSuperAdmin ? (
                        p.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(p, 'draft')}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(p, 'published')}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded"
                          >
                            Publish
                          </button>
                        )
                      ) : (
                        p.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(p, 'pending_review')}
                            className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded"
                          >
                            Submit Approval
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                          aria-label={`Delete ${p.name}`}
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {editingId ? 'Edit Pharmaceutical Product' : 'Add New Product'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md"
                    placeholder="CP-CV-101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dosage Form</label>
                  <input
                    type="text"
                    value={form.dosage_form}
                    onChange={(e) => setForm({ ...form, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                    placeholder="Film-Coated Tablet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={form.strength}
                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                    placeholder="20 mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Therapeutic Area</label>
                  <input
                    type="text"
                    value={form.therapeutic_area}
                    onChange={(e) => setForm({ ...form, therapeutic_area: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
                      placeholder="/uploads/..."
                    />
                    <button
                      type="button"
                      onClick={() => setMediaOpen(true)}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
                    >
                      Media Library
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Short Summary</label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Composition</label>
                  <textarea
                    rows={2}
                    value={form.composition}
                    onChange={(e) => setForm({ ...form, composition: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Packaging</label>
                  <textarea
                    rows={2}
                    value={form.packaging_info}
                    onChange={(e) => setForm({ ...form, packaging_info: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Storage Conditions</label>
                  <textarea
                    rows={2}
                    value={form.storage_conditions}
                    onChange={(e) => setForm({ ...form, storage_conditions: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span>Feature on Homepage</span>
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Submit for Approval</option>
                    {isSuperAdmin && <option value="published">Published</option>}
                    {isSuperAdmin && <option value="archived">Archived</option>}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
      />
    </div>
  );
}

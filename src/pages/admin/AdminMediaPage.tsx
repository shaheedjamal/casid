import React, { useEffect, useState } from 'react';
import { Copy, RefreshCw, Trash2, Upload } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { MediaAsset } from '../../types';

export function AdminMediaPage() {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await api.get('/media');
      setItems(res.data.media || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load media library.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedia();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setNotice('');

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds the 5 MB upload limit.');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('alt_text', file.name.replace(/\.[^.]+$/, ''));
      await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNotice(`Uploaded "${file.name}".`);
      await loadMedia();
    } catch (err) {
      setError(extractApiError(err, 'Upload failed.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleReplace(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setNotice('');
    try {
      const form = new FormData();
      form.append('file', file);
      await api.put(`/media/${id}/replace`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNotice(`Replaced asset #${id} and updated referencing pages/products.`);
      await loadMedia();
    } catch (err) {
      setError(extractApiError(err, 'Failed to replace image.'));
    } finally {
      e.target.value = '';
    }
  }

  async function handleDelete(item: MediaAsset) {
    setError('');
    setNotice('');
    try {
      await api.delete(`/media/${item.id}`);
      setNotice(`Deleted "${item.original_name}".`);
      await loadMedia();
    } catch (err) {
      setError(extractApiError(err, 'Cannot delete media asset.'));
    }
  }

  function handleCopyUrl(url: string) {
    navigator.clipboard?.writeText(url).catch(() => {});
    setNotice(`Copied asset path: ${url}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Media Library</h1>
          <p className="text-sm text-slate-600">
            Upload, preview, replace, and manage corporate imagery (JPG, PNG, WEBP, GIF up to 5 MB).
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md cursor-pointer whitespace-nowrap shrink-0">
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 border-b border-slate-200">
                <ResilientImage
                  src={item.url}
                  alt={item.alt_text || item.original_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 truncate">{item.original_name}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {(item.file_size / 1024).toFixed(1)} KB · {item.reference_count ?? 0} reference(s)
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Path</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <label
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer"
                      title="Replace image file"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleReplace(item.id, e)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                      aria-label={`Delete ${item.original_name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { ResilientImage } from '../ResilientImage';
import type { MediaAsset } from '../../types';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get('/media')
      .then((res) => setItems(res.data.media || []))
      .catch((err) => setError(extractApiError(err, 'Failed to load media library.')))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('alt_text', file.name);
      const res = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded: MediaAsset = res.data.media;
      setItems((prev) => [uploaded, ...prev]);
      onSelect(uploaded.url);
      onClose();
    } catch (err) {
      setError(extractApiError(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-slate-900">Select or Upload Image</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <p className="text-xs text-slate-600">Choose an existing asset or upload a new JPG, PNG, WEBP, or GIF (max 5MB).</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleQuickUpload} disabled={uploading} />
            </label>
          </div>

          {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="text-left border border-slate-200 hover:border-blue-700 rounded-md overflow-hidden bg-white transition-colors"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    <ResilientImage src={item.url} alt={item.alt_text || item.original_name} className="w-full h-full object-cover" />
                  </div>
                  <p className="px-2.5 py-2 text-xs font-medium text-slate-800 truncate">{item.original_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

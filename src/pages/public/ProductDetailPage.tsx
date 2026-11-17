import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { Product } from '../../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/products/${encodeURIComponent(id)}`)
      .then((res) => {
        setProduct(res.data.product);
        setError('');
      })
      .catch(() => setError('Requested formulation was not found or is no longer published.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-96 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Product Unavailable</h1>
        <p className="text-sm text-slate-600">{error}</p>
        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-blue-800">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalogue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Catalogue</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <ResilientImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                fallbackLabel={product.name}
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>{product.category_name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.sku}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 tracking-tight">
                {product.name}
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Dosage Form</span>
                <span className="col-span-2 text-slate-900">{product.dosage_form || '—'}</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Strength</span>
                <span className="col-span-2 font-mono text-slate-900">{product.strength || '—'}</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Therapeutic Area</span>
                <span className="col-span-2 text-slate-900">{product.therapeutic_area || '—'}</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Composition</span>
                <span className="col-span-2 text-slate-900 leading-relaxed">{product.composition || '—'}</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Packaging</span>
                <span className="col-span-2 text-slate-900">{product.packaging_info || '—'}</span>
              </div>
              <div className="grid grid-cols-3 px-5 py-3.5 text-sm">
                <span className="font-medium text-slate-500">Storage Conditions</span>
                <span className="col-span-2 text-slate-900">{product.storage_conditions || '—'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={`/contact?product=${product.id}&subject=${encodeURIComponent(`Product Enquiry: ${product.name} (${product.sku})`)}`}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors"
              >
                Submit Product Enquiry
              </Link>
              <Link
                to="/quality"
                className="px-5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
              >
                View Quality Standards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

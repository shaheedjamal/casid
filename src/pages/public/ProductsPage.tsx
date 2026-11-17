import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { Category, Product } from '../../types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory !== 'all') params.set('category', selectedCategory);

    api
      .get(`/products?${params.toString()}`)
      .then((res) => {
        if (active) setProducts(res.data.products || []);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, selectedCategory]);

  return (
    <div className="bg-white min-h-[70vh]">
      <section className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Pharmaceutical Portfolio</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Product Catalogue
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Browse published Casid Pharma formulations by therapeutic category, dosage form, or active specification.
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, or therapeutic area..."
                aria-label="Search pharmaceutical products"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-800 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-800 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-slate-100 border border-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center space-y-3">
              <p className="text-base font-medium text-slate-900">No matching formulations found</p>
              <p className="text-sm text-slate-600">Try clearing your search filter or selecting a different category.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 text-xs font-medium text-blue-800 border border-blue-800 rounded-md hover:bg-blue-50"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
                >
                  <Link to={`/products/${product.slug}`} className="aspect-[4/3] bg-slate-100 border-b border-slate-200 block overflow-hidden">
                    <ResilientImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      fallbackLabel={product.name}
                    />
                  </Link>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                      <span>{product.category_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{product.sku}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-lg font-bold text-slate-900">
                      <Link to={`/products/${product.slug}`} className="hover:text-blue-800">
                        {product.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {product.dosage_form} · {product.strength}
                    </p>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
                      {product.short_description}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        to={`/products/${product.slug}`}
                        className="text-sm font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap"
                      >
                        View Specification →
                      </Link>
                      <Link
                        to={`/contact?product=${product.id}&subject=${encodeURIComponent(`Product Enquiry: ${product.name} (${product.sku})`)}`}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap transition-colors"
                      >
                        Enquire
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

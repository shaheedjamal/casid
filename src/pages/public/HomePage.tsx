import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { Category, CmsPage, NewsArticle, Product } from '../../types';

export function HomePage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadHome() {
      try {
        const [pageRes, prodRes, catRes, newsRes] = await Promise.all([
          api.get('/pages/home'),
          api.get('/products?featured=1'),
          api.get('/categories'),
          api.get('/news'),
        ]);
        if (!active) return;
        setPage(pageRes.data.page);
        setFeaturedProducts((prodRes.data.products || []).slice(0, 4));
        setCategories(catRes.data.categories || []);
        setLatestNews((newsRes.data.news || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadHome();
    return () => {
      active = false;
    };
  }, []);

  const content = page?.content || {};
  const whyChoose = Array.isArray(content.whyChooseItems) ? content.whyChooseItems : [];
  const totalPublishedProducts = categories.reduce((acc, c) => acc + (c.product_count || 0), 0);

  return (
    <div>
      {/* Hero Split Section */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-wider uppercase text-blue-800">
                Pharmaceutical Formulations · Analytical R&amp;D
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
                {page?.title || 'Precision Pharmaceutical Formulations Built on Rigorous Science'}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {page?.subtitle ||
                  'Casid Pharma integrates formulation research, controlled manufacturing, and end-to-end batch traceability to supply dependable medicines to healthcare partners.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{content.heroPrimaryCta || 'Explore Product Catalogue'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {content.heroSecondaryCta || 'Contact Medical Affairs'}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-lg overflow-hidden border border-slate-200 bg-white">
                <ResilientImage
                  src={page?.hero_image_url || '/src/assets/images/hero_pharma_lab_1794888599256.jpg'}
                  alt="Casid Pharma formulation and analytical research laboratory"
                  className="w-full h-full object-cover"
                  fallbackLabel="Casid Pharma Research Laboratory"
                />
              </div>
            </div>
          </div>

          {/* Full-Width Portfolio Summary Strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="p-5">
              <p className="text-xs text-slate-500">Therapeutic Categories</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {loading ? '—' : categories.length}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Published Formulations</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {loading ? '—' : totalPublishedProducts}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Quality Governance</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900">QMS-01 / ALCOA+</p>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500">Dosage Platforms</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900">Oral Solid &amp; Sterile</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Introduction & Why Choose Casid Pharma */}
      <section className="py-16 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
                {content.introHeading || 'Advancing Reliable Therapeutics Through Disciplined Formulation'}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {content.introBody ||
                  'Every dosage form at Casid Pharma begins with physicochemical characterization, excipient compatibility screening, and validated analytical methods.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 hover:text-blue-900"
                >
                  <span>Read Corporate Overview</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 divide-y divide-slate-200 border-t border-b border-slate-200">
              {whyChoose.map((item: { index: string; title: string; description: string }, idx: number) => (
                <div key={idx} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6">
                  <div className="sm:col-span-2 font-mono text-sm font-medium text-blue-800">
                    {item.index || `0${idx + 1}`}.
                  </div>
                  <div className="sm:col-span-10 space-y-1">
                    <h3 className="font-display text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Featured Formulations
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Selected oral solid and sterile parenteral products from our active database catalogue.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap shrink-0"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-600">
              No featured products are currently published.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group bg-white border border-slate-200 hover:border-blue-700/50 rounded-lg overflow-hidden transition-colors flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-200">
                    <ResilientImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      fallbackLabel={product.name}
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <span>{product.category_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{product.strength}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900 group-hover:text-blue-800">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">{product.short_description}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-800">
                      <span>{product.dosage_form}</span>
                      <span>Details →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* R&D & Quality Highlights */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-slate-100 border-b border-slate-200">
              <ResilientImage
                src="/src/assets/images/rd_molecular_research_1794888599854.jpg"
                alt="Casid Pharma R&D analytical chromatography suite"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-800">
                  <FlaskConical className="w-4 h-4" aria-hidden="true" />
                  <span>Research &amp; Development</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {content.rdHighlightHeading || 'Formulation Science & Analytical R&D'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {content.rdHighlightBody ||
                    'Focused on modified-release oral matrices, moisture-barrier packaging optimization, and stability-indicating analytical methods.'}
                </p>
              </div>
              <Link to="/research" className="text-sm font-medium text-blue-800 hover:text-blue-900">
                Explore R&amp;D Programs →
              </Link>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-slate-100 border-b border-slate-200">
              <ResilientImage
                src="/src/assets/images/news_qc_laboratory_1794888601901.jpg"
                alt="Casid Pharma quality control laboratory"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-800">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Quality &amp; Compliance</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {content.qualityHighlightHeading || 'Uncompromising Quality & Governance'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {content.qualityHighlightBody ||
                    'Structured Quality Management Systems aligned with cGMP and Good Documentation Practice (GDP) frameworks.'}
                </p>
              </div>
              <Link to="/quality" className="text-sm font-medium text-blue-800 hover:text-blue-900">
                Review Quality Standards →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Latest News &amp; Announcements
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Facility milestones, research publications, and corporate updates.
              </p>
            </div>
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 hover:text-blue-900 whitespace-nowrap shrink-0"
            >
              <span>All Announcements</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group bg-white border border-slate-200 hover:border-blue-700/50 rounded-lg overflow-hidden flex flex-col transition-colors"
              >
                <div className="aspect-[4/3] bg-slate-100 border-b border-slate-200 overflow-hidden">
                  <ResilientImage
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    fallbackLabel={item.category_label}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>{item.category_label}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={item.published_at} className="font-mono">
                      {new Date(item.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-slate-900 group-hover:text-blue-800 leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Call-to-Action */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance]">
              Partner With Casid Pharma for Institutional Supply or Medical Information
            </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Submit product formulation queries, dossier verification requests, or distribution enquiries directly to our team.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-950 bg-white hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <span>Submit an Enquiry</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

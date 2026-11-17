import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { CmsPage } from '../../types';

export function AboutPage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/pages/about')
      .then((res) => setPage(res.data.page))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const c = page?.content || {};
  const coreValues = Array.isArray(c.coreValues) ? c.coreValues : [];
  const capabilities = Array.isArray(c.capabilities) ? c.capabilities : [];

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Corporate Profile</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
              {page?.title || 'About Casid Pharma'}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">{page?.subtitle}</p>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-white">
              <ResilientImage
                src={page?.hero_image_url || '/src/assets/images/about_pharma_facility_1794888600146.jpg'}
                alt="Casid Pharma campus and corporate headquarters"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Overview & History */}
      <section className="py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Company Overview</h2>
            <p className="text-slate-600 leading-relaxed">{c.overview}</p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Corporate History</h2>
            <p className="text-slate-600 leading-relaxed">{c.history}</p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-lg p-7 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Vision</p>
            <p className="text-base font-medium text-slate-900 leading-relaxed">{c.vision}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-7 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Mission</p>
            <p className="text-base font-medium text-slate-900 leading-relaxed">{c.mission}</p>
          </div>
        </div>
      </section>

      {/* Core Values & Capabilities */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {coreValues.map((val: { title: string; detail: string }, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-5 space-y-2">
                  <p className="font-mono text-xs text-blue-800">0{idx + 1}.</p>
                  <h3 className="font-display text-base font-semibold text-slate-900">{val.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{val.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">Manufacturing Capabilities</h2>
            <ul className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {capabilities.map((cap: string, idx: number) => (
                <li key={idx} className="py-3.5 text-sm text-slate-700 leading-relaxed">
                  {cap}
                </li>
              ))}
            </ul>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2">
              <h3 className="font-display text-sm font-semibold text-slate-900">Quality Commitment</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{c.qualityCommitment}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

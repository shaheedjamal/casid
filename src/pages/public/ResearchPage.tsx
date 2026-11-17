import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { CmsPage } from '../../types';

export function ResearchPage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/pages/research')
      .then((res) => setPage(res.data.page))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-72 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const c = page?.content || {};
  const activities = Array.isArray(c.activities) ? c.activities : [];
  const projects = Array.isArray(c.projects) ? c.projects : [];
  const publications = Array.isArray(c.publications) ? c.publications : [];

  return (
    <div className="bg-white">
      <section className="bg-slate-50 border-b border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Innovation &amp; Analytical Science</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
              {page?.title || 'Research & Development'}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">{page?.subtitle}</p>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-white">
              <ResilientImage
                src={page?.hero_image_url || '/src/assets/images/rd_molecular_research_1794888599854.jpg'}
                alt="Casid Pharma R&D Scientist operating chromatography instrumentation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-3">
            <h2 className="font-display text-2xl font-bold text-slate-900">R&amp;D Overview</h2>
            <p className="text-slate-600 leading-relaxed">{c.overview}</p>
          </div>
          <div className="lg:col-span-7 divide-y divide-slate-200 border-t border-b border-slate-200">
            {activities.map((act: { code: string; title: string; description: string }, idx: number) => (
              <div key={idx} className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
                <span className="sm:col-span-2 font-mono text-sm font-medium text-blue-800">
                  {act.code || `0${idx + 1}`}.
                </span>
                <div className="sm:col-span-10 space-y-1">
                  <h3 className="font-display text-base font-semibold text-slate-900">{act.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Active Formulation Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj: { title: string; stage: string; focus: string }, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
                <p className="text-xs font-medium text-blue-800">{proj.stage}</p>
                <h3 className="font-display text-base font-semibold text-slate-900 leading-snug">{proj.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{proj.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Technical Publications &amp; Updates</h2>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
            {publications.map((pub: { title: string; year: string; author: string; summary: string }, idx: number) => (
              <div key={idx} className="p-6 space-y-2">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-mono">{pub.year}</span>
                  <span aria-hidden="true">·</span>
                  <span>{pub.author}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900">{pub.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{pub.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

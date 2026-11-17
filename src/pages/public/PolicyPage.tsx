import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { CmsPage } from '../../types';

interface PolicyPageProps {
  slug: 'privacy-policy' | 'terms-and-conditions';
}

export function PolicyPage({ slug }: PolicyPageProps) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/pages/${slug}`)
      .then((res) => setPage(res.data.page))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const sections = Array.isArray(page?.content?.sections) ? page.content.sections : [];

  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="pb-6 border-b border-slate-200 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Corporate Governance</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{page?.title}</h1>
          <p className="text-sm text-slate-600">{page?.subtitle}</p>
          {page?.content?.effectiveDate && (
            <p className="text-xs font-mono text-slate-500 pt-1">
              Effective Date: {page.content.effectiveDate}
            </p>
          )}
        </header>

        <div className="space-y-8">
          {sections.map((sec: { heading: string; body: string }, idx: number) => (
            <section key={idx} className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">{sec.heading}</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{sec.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

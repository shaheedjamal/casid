import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { CmsPage } from '../../types';

export function QualityPage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/pages/quality')
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
  const pillars = Array.isArray(c.qmsPillars) ? c.qmsPillars : [];
  const records = Array.isArray(c.verifiedRecords) ? c.verifiedRecords : [];

  return (
    <div className="bg-white">
      <section className="bg-slate-50 border-b border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Quality Management &amp; Governance</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
              {page?.title || 'Quality & Compliance'}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">{page?.subtitle}</p>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-white">
              <ResilientImage
                src={page?.hero_image_url || '/src/assets/images/news_qc_laboratory_1794888601901.jpg'}
                alt="Casid Pharma quality control testing suite"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display text-2xl font-bold text-slate-900">Quality Architecture</h2>
            <p className="text-slate-600 leading-relaxed">{c.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar: { title: string; description: string }, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-6 space-y-2 bg-white">
                <p className="font-mono text-xs text-blue-800">0{idx + 1}.</p>
                <h3 className="font-display text-base font-semibold text-slate-900">{pillar.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-slate-900">Verified Governance &amp; Compliance Records</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{c.certificationsNote}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Standard / Document</th>
                  <th className="px-5 py-3.5">Operational Scope</th>
                  <th className="px-5 py-3.5">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((rec: { standard: string; scope: string; status: string }, idx: number) => (
                  <tr key={idx}>
                    <td className="px-5 py-4 font-medium text-slate-900">{rec.standard}</td>
                    <td className="px-5 py-4 text-slate-600">{rec.scope}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">{rec.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2">
            <Link
              to="/contact?subject=Quality%20Documentation%20Request"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors"
            >
              Request Verified Quality Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

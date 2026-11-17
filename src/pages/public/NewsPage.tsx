import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { NewsArticle } from '../../types';

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/news')
      .then((res) => setArticles(res.data.news || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-[70vh]">
      <section className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Corporate Communications</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            News &amp; Updates
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Official announcements, research milestones, and quality updates from Casid Pharma.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-600">
              No corporate announcements are currently published.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white border border-slate-200 hover:border-blue-700/50 rounded-lg overflow-hidden flex flex-col transition-colors"
                >
                  <Link to={`/news/${article.slug}`} className="aspect-[4/3] bg-slate-100 border-b border-slate-200 block">
                    <ResilientImage
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      fallbackLabel={article.category_label}
                    />
                  </Link>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>{article.category_label}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={article.published_at} className="font-mono">
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                    <h2 className="mt-2 font-display text-lg font-bold text-slate-900 leading-snug">
                      <Link to={`/news/${article.slug}`} className="hover:text-blue-800">
                        {article.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
                      {article.summary}
                    </p>
                    <Link
                      to={`/news/${article.slug}`}
                      className="mt-4 pt-3 border-t border-slate-100 text-sm font-medium text-blue-800 hover:text-blue-900"
                    >
                      Read Full Release →
                    </Link>
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

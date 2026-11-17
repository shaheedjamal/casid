import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { ResilientImage } from '../../components/ResilientImage';
import type { NewsArticle } from '../../types';

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/news/${encodeURIComponent(id)}`)
      .then((res) => setArticle(res.data.article))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-80 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Announcement Not Found</h1>
        <Link to="/news" className="inline-flex items-center gap-2 text-sm font-medium text-blue-800">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to News &amp; Updates</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link to="/news" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to News &amp; Updates</span>
        </Link>

        <header className="space-y-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-medium text-blue-800">{article.category_label}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.published_at} className="font-mono">
              {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
            {article.title}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">{article.summary}</p>
        </header>

        {article.image_url && (
          <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <ResilientImage src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4 text-base text-slate-700 leading-relaxed">
          {article.content.split(/\n\n+/).map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

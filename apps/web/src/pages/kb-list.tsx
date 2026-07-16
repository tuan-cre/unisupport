import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import AppLayout from '../components/app-layout';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { BookOpen } from 'lucide-react';

export default function KbListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const res = await api.get('/kb/categories');
      return res.data.data as { id: string; name: string; _count: { articles: number } }[];
    },
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['kb-articles', selectedCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (search) params.set('q', search);
      const res = await api.get(`/kb/articles?${params}`);
      return res.data.data as {
        id: string;
        title: string;
        slug: string;
        category: { name: string } | null;
        createdAt: string;
      }[];
    },
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-slate-500" />
        <h2 className="text-xl font-semibold text-slate-900">Knowledge Base</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="max-w-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c._count.articles})
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {articles && articles.length === 0 && <p className="text-slate-500">No articles found.</p>}

      {articles && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              to={`/kb/${a.slug}`}
              className="block rounded-xl border bg-white p-4 transition-colors hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">{a.title}</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {a.category?.name && <>{a.category.name} &middot; </>}
                {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

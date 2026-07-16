import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import AppLayout from '../components/app-layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function KbArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: async () => {
      const res = await api.get(`/kb/articles/${slug}`);
      return res.data.data as any;
    },
  });

  const voteMutation = useMutation({
    mutationFn: (helpful: boolean) => api.post(`/kb/articles/${slug}/vote`, { helpful }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="mb-2 h-4 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout>
        <p className="text-slate-500">Article not found.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/kb')}
        className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Base
      </button>

      <article className="prose prose-slate max-w-none">
        <h1 className="text-2xl font-bold text-slate-900">{article.title}</h1>
        <p className="text-xs text-slate-500">
          {article.category?.name && <>{article.category.name} &middot; </>}
          {article.viewCount} views
        </p>
        <div className="mt-6 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
          {article.content}
        </div>
      </article>

      <Card className="mt-8">
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-sm text-slate-600">Was this helpful?</span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => voteMutation.mutate(true)}
              disabled={voteMutation.isPending}
            >
              <ThumbsUp className="mr-1 h-4 w-4" /> Yes ({article.helpful})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => voteMutation.mutate(false)}
              disabled={voteMutation.isPending}
            >
              <ThumbsDown className="mr-1 h-4 w-4" /> No ({article.notHelpful})
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

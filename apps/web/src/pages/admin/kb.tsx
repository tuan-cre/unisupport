import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

interface KbArticle {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  category?: { id: string; name: string };
  published: boolean;
  viewCount: number;
  helpful: number;
  notHelpful: number;
}

export default function AdminKbPage() {
  const { t } = useTranslation(['common', 'page']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KbArticle | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [published, setPublished] = useState(true);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-kb-articles'],
    queryFn: async () => {
      const res = await api.get('/kb/admin/articles');
      return res.data.data as KbArticle[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const res = await api.get('/kb/categories');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { title, content, categoryId: categoryId || undefined, published };
      if (editing) {
        await api.patch(`/kb/admin/articles/${editing.id}`, body);
      } else {
        await api.post('/kb/admin/articles', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kb-articles'] });
      toast({ title: editing ? t('Article updated') : t('Article created') });
      setShowForm(false);
      setEditing(null);
      setTitle('');
      setContent('');
      setCategoryId('');
      setPublished(true);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast({ title: err.response?.data?.message || t('Failed to save'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/kb/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kb-articles'] });
      toast({ title: t('Article deleted') });
    },
  });

  const openEdit = (article: KbArticle) => {
    setEditing(article);
    setTitle(article.title);
    setContent(article.content);
    setCategoryId(article.categoryId ?? '');
    setPublished(article.published);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Knowledge Base')}</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setTitle('');
            setContent('');
            setCategoryId('');
            setPublished(true);
            setShowForm(true);
          }}
        >
          {t('Create article')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {articles && articles.length === 0 && (
        <p className="text-slate-500">{t('No articles yet.')}</p>
      )}

      {articles && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((a: KbArticle) => (
            <div key={a.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{a.title}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {a.category?.name && <span>{a.category.name}</span>}
                    <Badge variant={a.published ? 'default' : 'secondary'}>
                      {a.published ? t('Published') : t('Draft')}
                    </Badge>
                    <span>
                      {a.viewCount} {t('views')}
                    </span>
                    <span>
                      {a.helpful}/{a.notHelpful} {t('votes')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                    {t('Edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('Delete?'))) deleteMutation.mutate(a.id);
                    }}
                  >
                    {t('Delete')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog
          open={showForm}
          onOpenChange={(v) => {
            if (!v) {
              setShowForm(false);
              setEditing(null);
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? t('Edit Article') : t('Create Article')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('Title')}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('Content')}</label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('Category')}</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('No category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('No category')}</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                {t('Published')}
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {t('Cancel')}
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !title.trim() || !content.trim()}
                >
                  {saveMutation.isPending ? t('Saving...') : t('Save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}

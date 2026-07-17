import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import EmptyState from '../../components/empty-state';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface KnownError {
  id: string;
  subject: string;
  description: string;
  workaround: string;
  solution: string;
  category: string;
  severity: string;
}

export default function AdminKnownErrorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<KnownError | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    workaround: '',
    solution: '',
    category: '',
    severity: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-known-errors', page],
    queryFn: async () => {
      const r = await api.get('/known-errors', { params: { page, limit: 20 } });
      return { items: r.data.data as KnownError[], meta: r.data.meta };
    },
  });

  const create = useMutation({
    mutationFn: (body: {
      subject: string;
      description: string;
      workaround: string;
      solution: string;
      category: string;
      severity: string;
    }) => api.post('/known-errors', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-known-errors'] });
      setShowCreate(false);
      setForm({
        subject: '',
        description: '',
        workaround: '',
        solution: '',
        category: '',
        severity: '',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      subject: string;
      description: string;
      workaround: string;
      solution: string;
    }) => api.patch(`/known-errors/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-known-errors'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/known-errors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-known-errors'] }),
  });

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t('Known Errors')}</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('Create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('New Known Error')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder={t('Subject')}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-border p-2 text-sm"
                rows={3}
                placeholder={t('Description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder={t('Workaround')}
                value={form.workaround}
                onChange={(e) => setForm({ ...form, workaround: e.target.value })}
              />
              <Input
                placeholder={t('Solution')}
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
              />
              <Input
                placeholder={t('Category')}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder={t('Severity')}
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              />
              <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
                {t('Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {data && data.items.length === 0 && (
        <EmptyState
          title={t('No known errors')}
          message={t('Known errors appear here when logged.')}
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              {t('Create known error')}
            </Button>
          }
        />
      )}
      {data?.items?.map((ke: KnownError) => (
        <Card key={ke.id} className="mb-2">
          <CardContent className="flex items-start justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{ke.subject}</span>
                {ke.severity && (
                  <span className="text-xs text-muted-foreground">({ke.severity})</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{ke.description}</p>
              {ke.workaround && (
                <p className="text-xs text-blue-600">
                  {t('Workaround')}: {ke.workaround}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(ke)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(ke.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('Page')} {page} / {data?.meta?.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('Previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (data?.meta?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('Next')}
          </Button>
        </div>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit Known Error')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <Input
                defaultValue={editing.subject}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-border p-2 text-sm"
                rows={3}
                defaultValue={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <Input
                defaultValue={editing.workaround || ''}
                placeholder={t('Workaround')}
                onChange={(e) => setEditing({ ...editing, workaround: e.target.value })}
              />
              <Input
                defaultValue={editing.solution || ''}
                placeholder={t('Solution')}
                onChange={(e) => setEditing({ ...editing, solution: e.target.value })}
              />
              <Button
                onClick={() =>
                  update.mutate({
                    id: editing.id,
                    subject: editing.subject,
                    description: editing.description,
                    workaround: editing.workaround,
                    solution: editing.solution,
                  })
                }
                disabled={update.isPending}
              >
                {t('Save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

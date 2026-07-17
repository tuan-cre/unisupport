import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
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
import ConfirmDialog from '../../components/confirm-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Problem {
  id: string;
  subject: string;
  description: string;
  status: string;
  category?: string;
  rootCause?: string;
  workaround?: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
  assignedToId?: string;
  tickets?: { ticket: { id: string } }[];
}

interface ProblemForm {
  subject: string;
  description: string;
  category: string;
  rootCause: string;
  workaround: string;
  assignedToId: string;
  ticketIds: string;
}

type CreateProblemInput = Omit<ProblemForm, 'ticketIds'> & { ticketIds?: string | string[] };

const statusColors: Record<string, string> = {
  IDENTIFIED: 'bg-yellow-100 text-yellow-800',
  ANALYZING: 'bg-blue-100 text-blue-800',
  ROOT_CAUSE_FOUND: 'bg-purple-100 text-purple-800',
  KNOWN_ERROR: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

export default function AdminProblemsPage() {
  const { t } = useTranslation(['common', 'page']);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Problem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProblemForm>({
    subject: '',
    description: '',
    category: '',
    rootCause: '',
    workaround: '',
    assignedToId: '',
    ticketIds: '',
  });
  const [editForm, setEditForm] = useState<ProblemForm>({
    subject: '',
    description: '',
    category: '',
    rootCause: '',
    workaround: '',
    assignedToId: '',
    ticketIds: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-problems'],
    queryFn: async () => {
      const r = await api.get('/problems');
      return r.data.data as Problem[];
    },
  });

  const create = useMutation({
    mutationFn: (body: CreateProblemInput) => api.post('/problems', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-problems'] });
      setShowCreate(false);
      setForm({
        subject: '',
        description: '',
        category: '',
        rootCause: '',
        workaround: '',
        assignedToId: '',
        ticketIds: '',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & CreateProblemInput) =>
      api.patch(`/problems/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-problems'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/problems/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-problems'] }),
  });

  const openEdit = (p: Problem) => {
    setEditing(p);
    setEditForm({
      subject: p.subject,
      description: p.description,
      category: p.category || '',
      rootCause: p.rootCause || '',
      workaround: p.workaround || '',
      assignedToId: p.assignedToId || '',
      ticketIds: p.tickets?.map((t: any) => t.ticket.id).join(',') || '',
    });
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Problems')}</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('Create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('New Problem')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder={t('Subject')}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-slate-200 p-2 text-sm"
                rows={3}
                placeholder={t('Description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder={t('Category')}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder={t('Root cause')}
                value={form.rootCause}
                onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
              />
              <Input
                placeholder={t('Workaround')}
                value={form.workaround}
                onChange={(e) => setForm({ ...form, workaround: e.target.value })}
              />
              <Input
                placeholder={t('Ticket IDs (comma-separated)')}
                value={form.ticketIds}
                onChange={(e) => setForm({ ...form, ticketIds: e.target.value })}
              />
              <Button
                onClick={() =>
                  create.mutate({
                    ...form,
                    ticketIds: form.ticketIds
                      ? form.ticketIds.split(',').map((s: string) => s.trim())
                      : [],
                  })
                }
                disabled={create.isPending}
              >
                {create.isPending ? t('Creating...') : t('Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {!isLoading && (!data || data.length === 0) && (
        <EmptyState title={t('No problems')} message={t('Create your first problem record.')} />
      )}
      {data?.map((p: Problem) => (
        <Card key={p.id} className="mb-3">
          <CardContent className="flex items-start justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Badge className={statusColors[p.status]}>{p.status}</Badge>
                <span className="text-sm font-medium text-slate-900">{p.subject}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
              {p.assignedTo && (
                <p className="mt-1 text-xs text-slate-400">
                  {t('Assignee')}: {p.assignedTo.firstName} {p.assignedTo.lastName}
                </p>
              )}
              {p.tickets && p.tickets.length > 0 && (
                <p className="text-xs text-slate-400">
                  {p.tickets.length} {t('ticket(s) linked')}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit Problem')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-slate-200 p-2 text-sm"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
              <Input
                placeholder={t('Category')}
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
              <Input
                placeholder={t('Root cause')}
                value={editForm.rootCause}
                onChange={(e) => setEditForm({ ...editForm, rootCause: e.target.value })}
              />
              <Input
                placeholder={t('Workaround')}
                value={editForm.workaround}
                onChange={(e) => setEditForm({ ...editForm, workaround: e.target.value })}
              />
              <Input
                placeholder={t('Ticket IDs (comma-separated)')}
                value={editForm.ticketIds}
                onChange={(e) => setEditForm({ ...editForm, ticketIds: e.target.value })}
              />
              <Button
                onClick={() =>
                  update.mutate({
                    id: editing.id,
                    ...editForm,
                    ticketIds: editForm.ticketIds
                      ? editForm.ticketIds.split(',').map((s: string) => s.trim())
                      : [],
                  })
                }
                disabled={update.isPending}
              >
                {update.isPending ? t('Saving...') : t('Save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => (deleteId ? remove.mutate(deleteId) : Promise.resolve())}
        title={t('Delete problem?')}
        description={t(
          'This will permanently delete this problem record and its linked relations.',
        )}
        confirmLabel={t('Delete')}
      />
    </AdminLayout>
  );
}

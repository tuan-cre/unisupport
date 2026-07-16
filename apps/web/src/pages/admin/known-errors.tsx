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

export default function AdminKnownErrorsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
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
    queryKey: ['admin-known-errors'],
    queryFn: async () => {
      const r = await api.get('/known-errors');
      return r.data.data;
    },
  });

  const create = useMutation({
    mutationFn: (body: any) => api.post('/known-errors', body),
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
    mutationFn: ({ id, ...body }: any) => api.patch(`/known-errors/${id}`, body),
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
        <h2 className="text-xl font-semibold text-slate-900">Known Errors</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Known Error</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-slate-200 p-2 text-sm"
                rows={3}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="Workaround"
                value={form.workaround}
                onChange={(e) => setForm({ ...form, workaround: e.target.value })}
              />
              <Input
                placeholder="Solution"
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder="Severity"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              />
              <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {data && data.length === 0 && (
        <EmptyState
          title="No known errors"
          message="Known errors appear here when logged."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              Create known error
            </Button>
          }
        />
      )}
      {data?.map((ke: any) => (
        <Card key={ke.id} className="mb-2">
          <CardContent className="flex items-start justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{ke.subject}</span>
                {ke.severity && <span className="text-xs text-slate-400">({ke.severity})</span>}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{ke.description}</p>
              {ke.workaround && (
                <p className="text-xs text-blue-600">Workaround: {ke.workaround}</p>
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

      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Known Error</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <Input
                defaultValue={editing.subject}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
              />
              <textarea
                className="rounded-md border border-slate-200 p-2 text-sm"
                rows={3}
                defaultValue={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <Input
                defaultValue={editing.workaround || ''}
                placeholder="Workaround"
                onChange={(e) => setEditing({ ...editing, workaround: e.target.value })}
              />
              <Input
                defaultValue={editing.solution || ''}
                placeholder="Solution"
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
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

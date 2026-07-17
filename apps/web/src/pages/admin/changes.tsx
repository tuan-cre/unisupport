import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

interface ChangeApproval {
  id: string;
  status: string;
  comment?: string;
  approver?: { firstName: string; lastName: string };
  role?: string;
}

interface Change {
  id: string;
  subject: string;
  description: string;
  status: string;
  riskLevel: string;
  plannedStart: string;
  plannedEnd: string;
  approvals: ChangeApproval[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  IMPLEMENTED: 'bg-green-100 text-green-800',
  REVIEWED: 'bg-teal-100 text-teal-800',
  CLOSED: 'bg-slate-100 text-slate-800',
  ROLLED_BACK: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function AdminChangesPage() {
  const { t } = useTranslation(['common', 'page']);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Change | null>(null);
  const [approvalComments, setApprovalComments] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    subject: '',
    description: '',
    riskLevel: '',
    plannedStart: '',
    plannedEnd: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-changes'],
    queryFn: async () => {
      const r = await api.get('/changes');
      return r.data.data as Change[];
    },
  });

  const create = useMutation({
    mutationFn: (body: {
      subject: string;
      description: string;
      riskLevel: string;
      plannedStart: string;
      plannedEnd: string;
    }) => api.post('/changes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-changes'] });
      setShowCreate(false);
      setForm({ subject: '', description: '', riskLevel: '', plannedStart: '', plannedEnd: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/changes/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-changes'] });
    },
  });

  const approveReject = useMutation({
    mutationFn: ({
      changeId,
      approvalId,
      status,
      comment,
    }: {
      changeId: string;
      approvalId: string;
      status: string;
      comment?: string;
    }) => api.patch(`/changes/${changeId}/approvals/${approvalId}`, { status, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-changes'] });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Change Requests')}</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('Create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('New Change Request')}</DialogTitle>
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
                placeholder={t('Risk level (low/medium/high/critical)')}
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
              />
              <Input
                type="date"
                placeholder={t('Planned start')}
                value={form.plannedStart}
                onChange={(e) => setForm({ ...form, plannedStart: e.target.value })}
              />
              <Input
                type="date"
                placeholder={t('Planned end')}
                value={form.plannedEnd}
                onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })}
              />
              <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
                {t('Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      <div className="grid gap-3">
        {data?.map((c: Change) => (
          <Card key={c.id} className="cursor-pointer hover:shadow-sm" onClick={() => setDetail(c)}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2">
                <Badge className={statusColors[c.status]}>{c.status}</Badge>
                <span className="text-sm font-medium text-slate-900">{c.subject}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
              <div className="mt-1 flex gap-3 text-xs text-slate-400">
                {c.riskLevel && (
                  <span>
                    {t('Risk')}: {c.riskLevel}
                  </span>
                )}
                {c.approvals?.length > 0 && (
                  <span>
                    {c.approvals.filter((a: ChangeApproval) => a.status === 'APPROVED').length}/
                    {c.approvals.length} {t('approved')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{detail?.subject}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-slate-600">{detail.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <Badge className={statusColors[detail.status]}>{detail.status}</Badge>
                <span>
                  {t('Risk')}: {detail.riskLevel || 'N/A'}
                </span>
                {detail.plannedStart && (
                  <span>
                    {t('Planned')}: {detail.plannedStart?.slice(0, 10)} –{' '}
                    {detail.plannedEnd?.slice(0, 10)}
                  </span>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">
                  {t('Approvals')} ({detail.approvals?.length || 0})
                </h4>
                {detail.approvals?.map((a: ChangeApproval) => (
                  <div key={a.id} className="mb-2 rounded-lg border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {a.approver
                          ? `${a.approver.firstName} ${a.approver.lastName}`
                          : a.role || t('Unassigned')}
                      </span>
                      <Badge
                        className={
                          a.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : a.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {a.status}
                      </Badge>
                    </div>
                    {a.comment && <p className="mt-1 text-xs text-slate-500">{a.comment}</p>}
                    {a.status === 'PENDING' && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          placeholder={t('Comment')}
                          value={approvalComments[a.id] || ''}
                          onChange={(e) =>
                            setApprovalComments((prev) => ({ ...prev, [a.id]: e.target.value }))
                          }
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            approveReject.mutate({
                              changeId: detail.id,
                              approvalId: a.id,
                              status: 'APPROVED',
                              comment: approvalComments[a.id],
                            });
                            setApprovalComments((prev) => {
                              const next = { ...prev };
                              delete next[a.id];
                              return next;
                            });
                          }}
                        >
                          <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            approveReject.mutate({
                              changeId: detail.id,
                              approvalId: a.id,
                              status: 'REJECTED',
                              comment: approvalComments[a.id],
                            });
                            setApprovalComments((prev) => {
                              const next = { ...prev };
                              delete next[a.id];
                              return next;
                            });
                          }}
                        >
                          <XCircle className="mr-1 h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

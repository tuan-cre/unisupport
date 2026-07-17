import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import AppLayout from '../components/app-layout';
import CsatSurvey from '../components/csat-survey';
import { ArrowLeft, Eye, Clock, Link2, History } from 'lucide-react';

const statusOptions = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'];
const TABS = ['Comments', 'History', 'Watchers', 'Relations', 'Time'] as const;

export default function TicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Comments');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeDesc, setTimeDesc] = useState('');
  const [relationTicketId, setRelationTicketId] = useState('');
  const [watcherUserId, setWatcherUserId] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data.data as any;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-min'],
    queryFn: async () => {
      const res = await api.get('/users?limit=100');
      return (res.data.data ?? []) as { id: string; firstName: string; lastName: string }[];
    },
    enabled: activeTab === 'Watchers',
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/tickets/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ content, isInternal: int }: { content: string; isInternal: boolean }) =>
      api.post(`/tickets/${id}/comments`, { content, isInternal: int || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setNewComment('');
      setIsInternal(false);
    },
  });

  const addWatcherMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/tickets/${id}/watchers`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setWatcherUserId('');
    },
  });

  const removeWatcherMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/tickets/${id}/watchers/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const addRelationMutation = useMutation({
    mutationFn: (ticketId: string) => api.post(`/tickets/${id}/relations`, { ticketId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setRelationTicketId('');
    },
  });

  const removeRelationMutation = useMutation({
    mutationFn: (relationId: string) => api.delete(`/tickets/relations/${relationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
  });

  const addTimeMutation = useMutation({
    mutationFn: ({ minutes, description }: { minutes: number; description?: string }) =>
      api.post(`/tickets/${id}/time`, { minutes, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setTimeMinutes('');
      setTimeDesc('');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="mb-4 h-7 w-3/4" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <div className="mb-4 flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">{t('common.noTickets')}</p>
      </AppLayout>
    );
  }

  const isAdminOrAgent = user?.role?.name === 'admin' || user?.role?.name === 'agent';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToTickets')}
          </button>
          <span className="text-sm text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{ticket.subject}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('common.created')} {new Date(ticket.createdAt).toLocaleString()}{' '}
                  {t('common.by')} {ticket.requester.firstName} {ticket.requester.lastName}
                </p>
              </div>
              {isAdminOrAgent && (
                <Select value={ticket.status} onValueChange={(v) => statusMutation.mutate(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <Badge variant={ticket.status === 'OPEN' ? 'secondary' : 'default'}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {t('ticket.priority')}: {ticket.priority}
              </span>
              {ticket.type && <Badge variant="outline">{ticket.type.replace('_', ' ')}</Badge>}
              {ticket.assignee && (
                <span className="text-xs text-muted-foreground">
                  {t('ticket.assignee')}: {ticket.assignee.firstName} {ticket.assignee.lastName}
                </span>
              )}
              {ticket.department && (
                <span className="text-xs text-muted-foreground">{ticket.department.name}</span>
              )}
            </div>

            <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
          </CardContent>
        </Card>

        <CsatSurvey
          ticketId={ticket.id}
          rating={ticket.myRating ?? undefined}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}
        />

        <Card>
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'Comments' && t('ticket.comments')}
                {tab === 'History' && t('ticket.history')}
                {tab === 'Watchers' && t('ticket.watchers')}
                {tab === 'Relations' && t('ticket.relations')}
                {tab === 'Time' && t('ticket.time')}
              </button>
            ))}
          </div>

          {activeTab === 'Comments' && (
            <CardContent className="p-6">
              <div className="mb-4 space-y-4">
                {ticket.comments?.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('common.noComments')}</p>
                )}
                {ticket.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`rounded-lg p-3 ${
                      c.isInternal ? 'border border-amber-200 bg-amber-50' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {c.author.firstName} {c.author.lastName} &middot;{' '}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      {c.isInternal && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {t('common.internalNote')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground">{c.content}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newComment.trim())
                    commentMutation.mutate({ content: newComment, isInternal });
                }}
                className="space-y-2"
              >
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('ticket.comments')}
                  rows={3}
                  required
                />
                <div className="flex items-center justify-between">
                  {isAdminOrAgent && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      {t('common.internalNote')}
                    </label>
                  )}
                  <Button type="submit" disabled={commentMutation.isPending}>
                    {commentMutation.isPending ? t('common.sendingComment') : t('common.send')}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}

          {activeTab === 'History' && (
            <CardContent className="p-6">
              {ticket.history?.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('common.noHistory')}</p>
              )}
              <div className="space-y-3">
                {ticket.history?.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {h.user.firstName} {h.user.lastName}
                        </span>{' '}
                        {t('common.changed')} <span className="font-medium">{h.field}</span>
                        {h.oldValue && (
                          <span>
                            {' '}
                            {t('common.from')} "{h.oldValue}"
                          </span>
                        )}
                        {h.newValue && (
                          <span>
                            {' '}
                            {t('common.to')} "{h.newValue}"
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {activeTab === 'Watchers' && isAdminOrAgent && (
            <CardContent className="p-6">
              <div className="mb-4 flex gap-2">
                <select
                  value={watcherUserId}
                  onChange={(e) => setWatcherUserId(e.target.value)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option value="">{t('common.selectUserToAdd')}</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => watcherUserId && addWatcherMutation.mutate(watcherUserId)}
                  disabled={!watcherUserId}
                >
                  {t('common.add')}
                </Button>
              </div>

              {ticket.watchers?.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('common.noWatchers')}</p>
              )}
              <div className="space-y-2">
                {ticket.watchers?.map((w: any) => (
                  <div
                    key={w.user.id}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {w.user.firstName} {w.user.lastName}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWatcherMutation.mutate(w.user.id)}
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {activeTab === 'Relations' && (
            <CardContent className="p-6">
              {isAdminOrAgent && (
                <div className="mb-4 flex gap-2">
                  <Input
                    value={relationTicketId}
                    onChange={(e) => setRelationTicketId(e.target.value)}
                    placeholder={t('common.enterTicketId')}
                  />
                  <Button
                    onClick={() => relationTicketId && addRelationMutation.mutate(relationTicketId)}
                    disabled={!relationTicketId}
                  >
                    {t('common.link')}
                  </Button>
                </div>
              )}

              {!ticket.relatedFrom?.length && !ticket.relatedTo?.length && (
                <p className="text-sm text-muted-foreground">{t('common.noRelatedTickets')}</p>
              )}
              <div className="space-y-2">
                {ticket.relatedFrom?.map((r: any) => (
                  <div
                    key={r.fromTicket.id}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => navigate(`/tickets/${r.fromTicket.id}`)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {r.fromTicket.subject}
                      </button>
                      <Badge variant="secondary">{r.fromTicket.status}</Badge>
                    </div>
                    {isAdminOrAgent && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRelationMutation.mutate(r.id)}
                      >
                        {t('common.unlink')}
                      </Button>
                    )}
                  </div>
                ))}
                {ticket.relatedTo?.map((r: any) => (
                  <div
                    key={r.toTicket.id}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => navigate(`/tickets/${r.toTicket.id}`)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {r.toTicket.subject}
                      </button>
                      <Badge variant="secondary">{r.toTicket.status}</Badge>
                    </div>
                    {isAdminOrAgent && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRelationMutation.mutate(r.id)}
                      >
                        {t('common.unlink')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {activeTab === 'Time' && (
            <CardContent className="p-6">
              {isAdminOrAgent && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const m = parseInt(timeMinutes);
                    if (m > 0)
                      addTimeMutation.mutate({ minutes: m, description: timeDesc || undefined });
                  }}
                  className="mb-4 flex gap-2"
                >
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    placeholder={t('common.minutes')}
                    className="w-28"
                  />
                  <Input
                    value={timeDesc}
                    onChange={(e) => setTimeDesc(e.target.value)}
                    placeholder={t('common.descriptionOptional')}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={addTimeMutation.isPending || !timeMinutes}>
                    {t('common.log')}
                  </Button>
                </form>
              )}

              {ticket.timeEntries?.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('common.noTimeEntries')}</p>
              )}
              <div className="space-y-2">
                {ticket.timeEntries?.map((e: any) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{e.minutes}m</span>
                        <span className="text-xs text-muted-foreground">
                          {t('common.by')} {e.user.firstName} {e.user.lastName}
                        </span>
                      </div>
                      {e.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
                {ticket.timeEntries?.length > 0 && (
                  <p className="pt-2 text-sm font-medium text-foreground">
                    {t('common.total')}:{' '}
                    {ticket.timeEntries.reduce((sum: number, e: any) => sum + e.minutes, 0)}{' '}
                    {t('common.minutes')}
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

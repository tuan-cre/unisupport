import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
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
import { ArrowLeft, Eye, Clock, Link2, History } from 'lucide-react';

const statusOptions = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'];
const TABS = ['Comments', 'History', 'Watchers', 'Relations', 'Time'] as const;

export default function TicketDetailPage() {
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
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white px-6 py-4">
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
        <p className="text-slate-500">Ticket not found.</p>
      </AppLayout>
    );
  }

  const isAdminOrAgent = user?.role?.name === 'admin' || user?.role?.name === 'agent';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm text-slate-400">#{ticket.id.slice(0, 8)}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Main ticket card */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900">{ticket.subject}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Created {new Date(ticket.createdAt).toLocaleString()} by{' '}
                  {ticket.requester.firstName} {ticket.requester.lastName}
                </p>
              </div>
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
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <Badge variant={ticket.status === 'OPEN' ? 'secondary' : 'default'}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <span className="text-xs font-medium text-slate-500">
                Priority: {ticket.priority}
              </span>
              {ticket.type && <Badge variant="outline">{ticket.type.replace('_', ' ')}</Badge>}
              {ticket.assignee && (
                <span className="text-xs text-slate-500">
                  Assigned to: {ticket.assignee.firstName} {ticket.assignee.lastName}
                </span>
              )}
              {ticket.department && (
                <span className="text-xs text-slate-500">{ticket.department.name}</span>
              )}
            </div>

            {ticket.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {ticket.tags.map((tt: any) => (
                  <Badge key={tt.tag.id} variant="secondary" className="text-xs">
                    {tt.tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* SLA Status */}
            {ticket.sla && ticket.slaStatus && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-900">
                  <Clock className="h-4 w-4" />
                  SLA: {ticket.sla.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Response: </span>
                    <span
                      className={
                        ticket.slaStatus.responseBreached
                          ? 'text-red-600 font-medium'
                          : 'text-green-600'
                      }
                    >
                      {ticket.slaStatus.firstResponseAt
                        ? ticket.slaStatus.responseBreached
                          ? 'Breached'
                          : 'Met'
                        : ticket.slaStatus.responseRemainingMs !== null
                          ? `${Math.ceil(ticket.slaStatus.responseRemainingMs / 60000)}m remaining`
                          : 'Overdue'}
                    </span>
                    <span className="text-slate-400"> ({ticket.sla.responseTime}m)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Resolution: </span>
                    <span
                      className={
                        ticket.slaStatus.resolutionBreached
                          ? 'text-red-600 font-medium'
                          : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                            ? 'text-green-600'
                            : 'text-slate-600'
                      }
                    >
                      {ticket.resolvedAt || ticket.closedAt
                        ? ticket.slaStatus.resolutionBreached
                          ? 'Breached'
                          : 'Met'
                        : ticket.slaStatus.resolutionRemainingMs !== null
                          ? `${Math.ceil(ticket.slaStatus.resolutionRemainingMs / 60000)}m remaining`
                          : 'Overdue'}
                    </span>
                    <span className="text-slate-400"> ({ticket.sla.resolutionTime}m)</span>
                  </div>
                </div>
              </div>
            )}

            <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Attachments ({ticket.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((a: any) => (
                    <a
                      key={a.id}
                      href={`/api/files/${a.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-lg border bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {a.mimeType.startsWith('image/') ? '🖼' : '📎'}
                      {a.originalName}
                      <span className="text-slate-400">({(a.size / 1024).toFixed(1)} KB)</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            {isAdminOrAgent && (
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  + Attach file
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const form = new FormData();
                      form.append('file', file);
                      await api.post(`/tickets/${id}/attachments`, form, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Comments tab */}
          {activeTab === 'Comments' && (
            <CardContent className="p-6">
              <div className="mb-4 space-y-4">
                {ticket.comments?.length === 0 && (
                  <p className="text-sm text-slate-400">No comments yet.</p>
                )}
                {ticket.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`rounded-lg p-3 ${c.isInternal ? 'border border-amber-200 bg-amber-50' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">
                        {c.author.firstName} {c.author.lastName} &middot;{' '}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      {c.isInternal && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          Internal
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{c.content}</p>
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
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  required
                />
                <div className="flex items-center justify-between">
                  {isAdminOrAgent && (
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Internal note
                    </label>
                  )}
                  <Button type="submit" disabled={commentMutation.isPending}>
                    {commentMutation.isPending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}

          {/* History tab */}
          {activeTab === 'History' && (
            <CardContent className="p-6">
              {ticket.history?.length === 0 && (
                <p className="text-sm text-slate-400">No history yet.</p>
              )}
              <div className="space-y-3">
                {ticket.history?.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-900">
                          {h.user.firstName} {h.user.lastName}
                        </span>{' '}
                        changed <span className="font-medium">{h.field}</span>
                        {h.oldValue && (
                          <span>
                            {' '}
                            from "<span className="text-slate-500">{h.oldValue}</span>"
                          </span>
                        )}
                        {h.newValue && (
                          <span>
                            {' '}
                            to "<span className="text-slate-500">{h.newValue}</span>"
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {/* Watchers tab */}
          {activeTab === 'Watchers' && isAdminOrAgent && (
            <CardContent className="p-6">
              <div className="mb-4 flex gap-2">
                <select
                  value={watcherUserId}
                  onChange={(e) => setWatcherUserId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select user to add...</option>
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
                  Add
                </Button>
              </div>

              {ticket.watchers?.length === 0 && (
                <p className="text-sm text-slate-400">No watchers.</p>
              )}
              <div className="space-y-2">
                {ticket.watchers?.map((w: any) => (
                  <div
                    key={w.user.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {w.user.firstName} {w.user.lastName}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWatcherMutation.mutate(w.user.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {/* Relations tab */}
          {activeTab === 'Relations' && (
            <CardContent className="p-6">
              {isAdminOrAgent && (
                <div className="mb-4 flex gap-2">
                  <Input
                    value={relationTicketId}
                    onChange={(e) => setRelationTicketId(e.target.value)}
                    placeholder="Enter ticket ID..."
                  />
                  <Button
                    onClick={() => relationTicketId && addRelationMutation.mutate(relationTicketId)}
                    disabled={!relationTicketId}
                  >
                    Link
                  </Button>
                </div>
              )}

              {!ticket.relatedFrom?.length && !ticket.relatedTo?.length && (
                <p className="text-sm text-slate-400">No related tickets.</p>
              )}
              <div className="space-y-2">
                {ticket.relatedFrom?.map((r: any) => (
                  <div
                    key={r.fromTicket.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-slate-400" />
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
                        Unlink
                      </Button>
                    )}
                  </div>
                ))}
                {ticket.relatedTo?.map((r: any) => (
                  <div
                    key={r.toTicket.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-slate-400" />
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
                        Unlink
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {/* Time tab */}
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
                    placeholder="Minutes"
                    className="w-28"
                  />
                  <Input
                    value={timeDesc}
                    onChange={(e) => setTimeDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={addTimeMutation.isPending || !timeMinutes}>
                    Log
                  </Button>
                </form>
              )}

              {ticket.timeEntries?.length === 0 && (
                <p className="text-sm text-slate-400">No time entries.</p>
              )}
              <div className="space-y-2">
                {ticket.timeEntries?.map((e: any) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{e.minutes}m</span>
                        <span className="text-xs text-slate-500">
                          by {e.user.firstName} {e.user.lastName}
                        </span>
                      </div>
                      {e.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{e.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
                {ticket.timeEntries?.length > 0 && (
                  <p className="pt-2 text-sm font-medium text-slate-900">
                    Total: {ticket.timeEntries.reduce((sum: number, e: any) => sum + e.minutes, 0)}{' '}
                    minutes
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

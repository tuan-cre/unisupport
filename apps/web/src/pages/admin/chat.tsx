import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Send } from 'lucide-react';

export default function AdminChatPage() {
  const { t } = useTranslation(['common', 'page']);
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const s = io(window.location.origin + '/ws', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('chat:new', () => {
      qc.invalidateQueries({ queryKey: ['admin-chat'] });
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [qc]);

  useEffect(() => {
    if (!socket || !detailId) return;
    socket.emit('join', `chat:${detailId}`);
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['admin-chat-detail', detailId] });
    };
    socket.on('chat:message', handler);
    return () => {
      socket.off('chat:message', handler);
    };
  }, [socket, detailId, qc]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-chat'],
    queryFn: async () => {
      const r = await api.get('/chat/conversations');
      return r.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-chat-detail', detailId],
    queryFn: async () => {
      const r = await api.get(`/chat/conversations/${detailId}`);
      return r.data.data;
    },
    enabled: !!detailId,
  });

  const sendMsg = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post(`/chat/conversations/${id}/agent-message`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-chat'] });
      qc.invalidateQueries({ queryKey: ['admin-chat-detail', detailId] });
      setMsg('');
    },
  });

  const closeConv = useMutation({
    mutationFn: (id: string) => api.patch(`/chat/conversations/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-chat'] });
      qc.invalidateQueries({ queryKey: ['admin-chat-detail', detailId] });
    },
  });

  const convert = useMutation({
    mutationFn: (id: string) => api.post(`/chat/conversations/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-chat'] });
      setDetailId(null);
    },
  });

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Live Chat')}</h2>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      <div className="grid gap-2">
        {data?.map((c: any) => (
          <Card
            key={c.id}
            className="cursor-pointer hover:shadow-sm"
            onClick={() => setDetailId(c.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    c.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-800'
                  }
                >
                  {c.status}
                </Badge>
                <span className="text-sm font-medium text-slate-900">{c.subject}</span>
                <span className="text-xs text-slate-400">
                  {c.user
                    ? `${c.user.firstName} ${c.user.lastName}`
                    : c.visitorName || c.visitorEmail || 'Anonymous'}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {c._count?.messages ?? 0} {t('msgs')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!detailId}
        onOpenChange={(v) => {
          if (!v) {
            setDetailId(null);
            setMsg('');
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.subject}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => closeConv.mutate(detail.id)}>
                  {t('Close')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => convert.mutate(detail.id)}>
                  {t('Convert to ticket')}
                </Button>
              </div>
              {detail.messages?.map((m: any) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.senderType === 'VISITOR'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-0.5">{m.senderName || m.senderType}</p>
                    {m.content}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 border-t pt-3">
                <Input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && msg.trim())
                      sendMsg.mutate({ id: detail.id, content: msg });
                  }}
                  placeholder={t('Reply...')}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => sendMsg.mutate({ id: detail.id, content: msg })}
                  disabled={!msg.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

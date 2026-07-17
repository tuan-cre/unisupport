import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
import AppLayout from '../components/app-layout';
import { Skeleton } from '../components/ui/skeleton';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type?: string;
  createdAt: string;
  requester: { firstName: string; lastName: string };
  assignee: { firstName: string; lastName: string } | null;
  tags?: { tag: { id: string; name: string } }[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusBadge: Record<string, string> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  PENDING: 'outline',
  RESOLVED: 'default',
  CLOSED: 'secondary',
} as const;

const priorityColor: Record<string, string> = {
  LOW: 'text-slate-500',
  MEDIUM: 'text-blue-600 font-medium',
  HIGH: 'text-orange-600 font-medium',
  URGENT: 'text-red-600 font-semibold',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function TicketListPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, debouncedSearch, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await api.get(`/tickets?${params}`);
      return { tickets: res.data.data as Ticket[], meta: res.data.meta as Meta };
    },
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('page.tickets')}</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('common.searchTickets')}
          className="flex-1 min-w-0"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('common.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('common.allStatuses')}</SelectItem>
            <SelectItem value="OPEN">{t('common.open')}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t('common.inProgress')}</SelectItem>
            <SelectItem value="PENDING">{t('common.pending')}</SelectItem>
            <SelectItem value="RESOLVED">{t('common.resolved')}</SelectItem>
            <SelectItem value="CLOSED">{t('common.closed')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('common.allPriorities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('common.allPriorities')}</SelectItem>
            <SelectItem value="LOW">{t('common.low')}</SelectItem>
            <SelectItem value="MEDIUM">{t('common.medium')}</SelectItem>
            <SelectItem value="HIGH">{t('common.high')}</SelectItem>
            <SelectItem value="URGENT">{t('common.urgent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {data && data?.tickets?.length === 0 && (
        <p className="text-slate-500">
          {t('common.noTicketsFound')}{' '}
          <Link to="/tickets/new" className="text-blue-600 hover:underline">
            {t('common.createOne')}
          </Link>
        </p>
      )}

      {data && data?.tickets?.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ticket.subject')}</TableHead>
                  <TableHead>{t('ticket.status')}</TableHead>
                  <TableHead>{t('ticket.priority')}</TableHead>
                  <TableHead>{t('ticket.type')}</TableHead>
                  <TableHead>{t('ticket.requester')}</TableHead>
                  <TableHead>{t('ticket.assignee')}</TableHead>
                  <TableHead>{t('common.createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell>
                      <div className="max-w-64">
                        <p className="truncate font-medium text-slate-900">{ticket.subject}</p>
                        {ticket.tags && ticket.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ticket.tags.slice(0, 3).map((tt) => (
                              <span
                                key={tt.tag.id}
                                className="rounded-full bg-slate-100 px-1.5 py-0 text-[10px] font-medium text-slate-600"
                              >
                                {tt.tag.name}
                              </span>
                            ))}
                            {ticket.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{ticket.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(statusBadge[ticket.status] || 'secondary') as any}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={priorityColor[ticket.priority] || ''}>
                      {ticket.priority}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {ticket.type ? ticket.type.replace('_', ' ') : '\u2014'}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {ticket.requester.firstName} {ticket.requester.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : '\u2014'}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.meta && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                {t('common.page')} {data.meta.page} {t('common.of')} {data.meta.totalPages} (
                {data.meta.total} {t('page.tickets').toLowerCase()})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

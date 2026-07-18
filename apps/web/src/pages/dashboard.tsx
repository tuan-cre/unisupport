import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import api from '../lib/api';
import AppLayout from '../components/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Ticket, Users, Building2, UserCheck } from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  recentTickets: RecentTicket[];
  agentTicketCount: number;
  totalUsers: number;
  totalAgents?: number;
  totalDepartments?: number;
  myAssigned?: number;
  myAssignedByStatus?: Record<string, number>;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  requester: { firstName: string; lastName: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#8b5cf6',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const statusBadge: Record<string, string> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  PENDING: 'outline',
  RESOLVED: 'default',
  CLOSED: 'secondary',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAgent = user?.role?.name === 'agent';
  const isAdmin = user?.role?.name === 'admin';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data as DashboardStats;
    },
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {t('common.welcome', { name: user?.firstName })}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('common.totalTickets')}
                </CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{stats?.totalTickets ?? 0}</p>
              </CardContent>
            </Card>

            {isAgent && (
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('common.myAssigned')}
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{stats?.myAssigned ?? 0}</p>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('common.totalUsers')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalUsers ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-violet-500 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('common.agents')}
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalAgents ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('common.departments')}
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.totalDepartments ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('common.ticketsByStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.ticketsByStatus && Object.keys(stats.ticketsByStatus).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={Object.entries(stats.ticketsByStatus).map(([k, v]) => ({
                        name: k.replace('_', ' '),
                        count: v,
                        fill: STATUS_COLORS[k] || '#6b7280',
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {Object.entries(stats.ticketsByStatus).map(([k]) => (
                          <Cell key={k} fill={STATUS_COLORS[k] || '#6b7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('common.noTickets')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('common.ticketsByPriority')}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.ticketsByPriority && Object.keys(stats.ticketsByPriority).length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.ticketsByPriority).map(([k, v]) => ({
                          name: k,
                          value: v,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry: any) =>
                          `${entry.name} (${((entry.percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      >
                        {Object.entries(stats.ticketsByPriority).map(([k]) => (
                          <Cell key={k} fill={PRIORITY_COLORS[k] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('common.noTickets')}</p>
                )}
              </CardContent>
            </Card>

            {isAgent && stats?.myAssignedByStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('common.myAssignedByStatus')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.myAssignedByStatus).length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={Object.entries(stats.myAssignedByStatus).map(([k, v]) => ({
                          name: k.replace('_', ' '),
                          count: v,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {Object.entries(stats.myAssignedByStatus).map(([k]) => (
                            <Cell key={k} fill={STATUS_COLORS[k] || '#6b7280'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('common.noAssignedTickets')}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('common.recentTickets')}</CardTitle>
              <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:underline">
                {t('common.viewAll')}
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTickets.map((t: RecentTicket) => (
                    <Link
                      key={t.id}
                      to={`/tickets/${t.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:bg-muted/50 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.requester.firstName} {t.requester.lastName}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Badge
                          variant={(statusBadge[t.status] || 'secondary') as any}
                          className="whitespace-nowrap"
                        >
                          {t.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('common.noTickets')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

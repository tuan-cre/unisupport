import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import api from '../lib/api';
import AppLayout from '../components/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Ticket, Users, Building2, UserCheck } from 'lucide-react';

const statusBadge: Record<string, string> = {
  OPEN: 'secondary',
  IN_PROGRESS: 'default',
  PENDING: 'outline',
  RESOLVED: 'default',
  CLOSED: 'secondary',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAgent = user?.role?.name === 'agent';
  const isAdmin = user?.role?.name === 'admin';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data as Record<string, any>;
    },
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Welcome, {user?.firstName}</h2>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total tickets
                </CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalTickets ?? 0}</p>
              </CardContent>
            </Card>

            {isAgent && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    My assigned
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{stats?.myAssigned ?? 0}</p>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Agents
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalAgents ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Departments
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats?.totalDepartments ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Tickets by status */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by status</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.ticketsByStatus && Object.keys(stats.ticketsByStatus).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.ticketsByStatus as Record<string, number>).map(
                      ([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <Badge variant={(statusBadge[status] || 'secondary') as any}>
                            {status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-medium text-slate-900">{count}</span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No tickets yet</p>
                )}
              </CardContent>
            </Card>

            {isAgent && stats?.myAssignedByStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>My assigned by status</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.myAssignedByStatus).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.myAssignedByStatus as Record<string, number>).map(
                        ([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <Badge variant={(statusBadge[status] || 'secondary') as any}>
                              {status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium text-slate-900">{count}</span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No assigned tickets</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent tickets */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent tickets</CardTitle>
              <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTickets.map((t: any) => (
                    <Link
                      key={t.id}
                      to={`/tickets/${t.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{t.subject}</p>
                        <p className="text-xs text-slate-500">
                          {t.requester.firstName} {t.requester.lastName}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Badge variant={(statusBadge[t.status] || 'secondary') as any}>
                          {t.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No tickets yet</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

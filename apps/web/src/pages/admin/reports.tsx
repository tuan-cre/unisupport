import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];

export default function AdminReportsPage() {
  const { t } = useTranslation(['common', 'page']);
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data: volume, isLoading: loadingVol } = useQuery({
    queryKey: ['report-volume', startDate, endDate],
    queryFn: async () => {
      const r = await api.get('/reports/ticket-volume', { params: { startDate, endDate } });
      return r.data.data;
    },
  });

  const { data: sla, isLoading: loadingSla } = useQuery({
    queryKey: ['report-sla', startDate, endDate],
    queryFn: async () => {
      const r = await api.get('/reports/sla-compliance', { params: { startDate, endDate } });
      return r.data.data;
    },
  });

  const { data: agents, isLoading: loadingAgents } = useQuery({
    queryKey: ['report-agents', startDate, endDate],
    queryFn: async () => {
      const r = await api.get('/reports/agent-performance', { params: { startDate, endDate } });
      return r.data.data;
    },
  });

  const { data: csat, isLoading: loadingCsat } = useQuery({
    queryKey: ['report-csat', startDate, endDate],
    queryFn: async () => {
      const r = await api.get('/reports/csat', { params: { startDate, endDate } });
      return r.data.data;
    },
  });

  const downloadCsv = (type: string) => {
    window.open(
      `/api/reports/export?type=${type}&startDate=${startDate}&endDate=${endDate}`,
      '_blank',
    );
  };

  const slaPieData = sla
    ? [
        { name: 'Met', value: sla.response.met },
        { name: 'Breached', value: sla.response.breached },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Reports')}</h2>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-sm text-slate-400">{t('to')}</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Ticket Volume */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('Ticket Volume')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => downloadCsv('ticket-volume')}>
            <Download className="mr-1 h-4 w-4" />
            {t('CSV')}
          </Button>
        </CardHeader>
        <CardContent>
          {loadingVol && <Skeleton className="h-64 w-full" />}
          {volume?.byDate && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volume.byDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name={t('Total')} />
                <Bar dataKey="open" fill="#f59e0b" name={t('Open')} />
                <Bar dataKey="resolved" fill="#22c55e" name={t('Resolved')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* SLA Compliance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('SLA Compliance')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCsv('sla')}>
              <Download className="mr-1 h-4 w-4" />
              {t('CSV')}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSla && <Skeleton className="h-48 w-full" />}
            {sla && (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={slaPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                    >
                      {slaPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded bg-green-50 p-2">
                    <p className="font-medium text-green-700">{sla.response.complianceRate}%</p>
                    <p className="text-xs text-green-600">{t('Response')}</p>
                  </div>
                  <div className="rounded bg-blue-50 p-2">
                    <p className="font-medium text-blue-700">{sla.resolution.complianceRate}%</p>
                    <p className="text-xs text-blue-600">{t('Resolution')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CSAT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('CSAT (Satisfaction)')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCsv('csat')}>
              <Download className="mr-1 h-4 w-4" />
              {t('CSV')}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingCsat && <Skeleton className="h-48 w-full" />}
            {csat && (
              <div>
                <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded bg-blue-50 p-2">
                    <p className="font-medium text-blue-700">
                      {csat.averageRating != null ? csat.averageRating.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-xs text-blue-600">{t('Avg Rating (/5)')}</p>
                  </div>
                  <div className="rounded bg-purple-50 p-2">
                    <p className="font-medium text-purple-700">{csat.totalResponses}</p>
                    <p className="text-xs text-purple-600">{t('Responses')}</p>
                  </div>
                </div>
                {csat.distribution && Object.keys(csat.distribution).length > 0 && (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={Object.entries(csat.distribution).map(([k, v]) => ({
                        rating: `${k} star`,
                        count: v,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {csat.recentRatings?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-500">{t('Recent:')}</p>
                    {csat.recentRatings.slice(0, 3).map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs"
                      >
                        <span className="text-slate-700">{r.ticket.subject.slice(0, 40)}</span>
                        <span className="font-medium text-yellow-600">
                          {'★'.repeat(r.rating)}
                          {'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Agent Performance')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => downloadCsv('agent-performance')}>
              <Download className="mr-1 h-4 w-4" />
              {t('CSV')}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingAgents && <Skeleton className="h-48 w-full" />}
            {agents && (
              <div className="space-y-2">
                {agents.slice(0, 5).map((a: any) => (
                  <div
                    key={a.agentId}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-900">{a.agentName}</span>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>
                        {a.resolved}/{a.totalTickets} {t('resolved')}
                      </span>
                      <span>
                        {a.avgResolutionMinutes}m {t('avg')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

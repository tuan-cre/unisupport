import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async ticketVolume(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, status: true, priority: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate: Record<
      string,
      { total: number; open: number; resolved: number; closed: number }
    > = {};
    for (const t of tickets) {
      const dateKey = t.createdAt.toISOString().slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = { total: 0, open: 0, resolved: 0, closed: 0 };
      byDate[dateKey].total++;
      if (t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'PENDING')
        byDate[dateKey].open++;
      else if (t.status === 'RESOLVED') byDate[dateKey].resolved++;
      else if (t.status === 'CLOSED') byDate[dateKey].closed++;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      total: tickets.length,
      byDate: Object.entries(byDate).map(([date, counts]) => ({ date, ...counts })),
    };
  }

  async slaCompliance(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        slaId: { not: null },
        firstResponseAt: { not: null },
      },
      include: { sla: true },
    });

    let responseMet = 0;
    let responseBreached = 0;
    let resolutionMet = 0;
    let resolutionBreached = 0;

    for (const t of tickets) {
      if (!t.sla) continue;
      const responseDeadline = new Date(t.createdAt.getTime() + t.sla.responseTime * 60 * 1000);
      if (t.firstResponseAt! <= responseDeadline) responseMet++;
      else responseBreached++;

      if (t.resolvedAt) {
        const resolutionDeadline = new Date(
          t.createdAt.getTime() + t.sla.resolutionTime * 60 * 1000,
        );
        if (t.resolvedAt <= resolutionDeadline) resolutionMet++;
        else resolutionBreached++;
      }
    }

    const totalResponse = responseMet + responseBreached;
    const totalResolution = resolutionMet + resolutionBreached;

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      response: {
        met: responseMet,
        breached: responseBreached,
        total: totalResponse,
        complianceRate: totalResponse > 0 ? Math.round((responseMet / totalResponse) * 100) : 0,
      },
      resolution: {
        met: resolutionMet,
        breached: resolutionBreached,
        total: totalResolution,
        complianceRate:
          totalResolution > 0 ? Math.round((resolutionMet / totalResolution) * 100) : 0,
      },
    };
  }

  async agentPerformance(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const agents = await this.prisma.user.findMany({
      where: {
        role: { name: { in: ['agent', 'admin'] } },
      },
      include: {
        assigned: {
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: { id: true, createdAt: true, status: true, resolvedAt: true, closedAt: true },
        },
        timeEntries: {
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: { minutes: true },
        },
      },
    });

    return agents.map((agent) => {
      const totalTickets = agent.assigned.length;
      const resolved = agent.assigned.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
      ).length;
      const totalMinutes = agent.timeEntries.reduce((sum, e) => sum + e.minutes, 0);

      // Calculate avg resolution time
      const resolutionTimes = agent.assigned
        .filter((t) => t.resolvedAt)
        .map((t) => t.resolvedAt!.getTime() - t.createdAt.getTime());
      const avgResolution =
        resolutionTimes.length > 0
          ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / 60000)
          : 0;

      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        totalTickets,
        resolved,
        open: totalTickets - resolved,
        avgResolutionMinutes: avgResolution,
        totalLoggedMinutes: totalMinutes,
      };
    });
  }

  async csat(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      message: 'CSAT data not yet available. Surveys coming in a future phase.',
      averageRating: null,
      totalResponses: 0,
    };
  }

  async exportCsv(type: string, startDate?: string, endDate?: string) {
    let data: any[];
    let headers: string[];
    let rows: string[];

    switch (type) {
      case 'ticket-volume': {
        const report = await this.ticketVolume(startDate, endDate);
        headers = ['Date', 'Total', 'Open', 'Resolved', 'Closed'];
        rows = report.byDate.map((d) => `${d.date},${d.total},${d.open},${d.resolved},${d.closed}`);
        data = report.byDate;
        break;
      }
      case 'sla': {
        const report = await this.slaCompliance(startDate, endDate);
        headers = ['Metric', 'Met', 'Breached', 'Total', 'Rate'];
        rows = [
          `Response,${report.response.met},${report.response.breached},${report.response.total},${report.response.complianceRate}%`,
          `Resolution,${report.resolution.met},${report.resolution.breached},${report.resolution.total},${report.resolution.complianceRate}%`,
        ];
        data = [report.response, report.resolution];
        break;
      }
      case 'agent-performance': {
        const report = await this.agentPerformance(startDate, endDate);
        headers = ['Agent', 'Total', 'Resolved', 'Open', 'Avg Resolution (min)', 'Logged (min)'];
        rows = report.map(
          (a) =>
            `${a.agentName},${a.totalTickets},${a.resolved},${a.open},${a.avgResolutionMinutes},${a.totalLoggedMinutes}`,
        );
        data = report;
        break;
      }
      default:
        return null;
    }

    const csv = [headers.join(','), ...rows].join('\n');
    return csv;
  }
}

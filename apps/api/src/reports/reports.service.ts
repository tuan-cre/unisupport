import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async ticketVolume(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const rows = await this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt")::date AS date, COUNT(*)::int AS count
      FROM "tickets"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    const toDateStr = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
    const byDate = rows.map((r) => ({
      date: toDateStr(r.date),
      total: Number(r.count),
      open: 0,
      resolved: 0,
      closed: 0,
    }));

    // Count by status for each date
    const statusRows = await this.prisma.$queryRaw<
      Array<{ date: Date; status: string; count: bigint }>
    >`
      SELECT DATE_TRUNC('day', "createdAt")::date AS date, status, COUNT(*)::int AS count
      FROM "tickets"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE_TRUNC('day', "createdAt"), status
      ORDER BY date ASC
    `;

    const statusMap: Record<string, { open: number; resolved: number; closed: number }> = {};
    for (const r of statusRows) {
      const key = r.date.toISOString().slice(0, 10);
      if (!statusMap[key]) statusMap[key] = { open: 0, resolved: 0, closed: 0 };
      if (r.status === 'OPEN' || r.status === 'IN_PROGRESS' || r.status === 'PENDING')
        statusMap[key].open += Number(r.count);
      else if (r.status === 'RESOLVED') statusMap[key].resolved += Number(r.count);
      else if (r.status === 'CLOSED') statusMap[key].closed += Number(r.count);
    }

    for (const d of byDate) {
      const s = statusMap[d.date];
      if (s) {
        d.open = s.open;
        d.resolved = s.resolved;
        d.closed = s.closed;
      }
    }

    const total = byDate.reduce((sum, d) => sum + d.total, 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      total,
      byDate,
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

    const [aggregate, ratings, distribution] = await Promise.all([
      this.prisma.ticketRating.aggregate({
        _avg: { rating: true },
        _count: { id: true },
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.ticketRating.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          rating: true,
          feedback: true,
          createdAt: true,
          ticket: { select: { id: true, subject: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.ticketRating.groupBy({
        by: ['rating'],
        _count: { id: true },
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      averageRating: aggregate._avg.rating,
      totalResponses: aggregate._count.id,
      distribution: Object.fromEntries(distribution.map((d) => [d.rating, d._count.id])),
      recentRatings: ratings,
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

  async generatePdf(type: string, startDate?: string, endDate?: string): Promise<Buffer> {
    const typeLabels: Record<string, string> = {
      'ticket-volume': 'Ticket Volume',
      sla: 'SLA Compliance',
      'agent-performance': 'Agent Performance',
      csat: 'Customer Satisfaction',
    };

    const displayType = typeLabels[type] || type;
    const period = startDate && endDate ? `${startDate} to ${endDate}` : `Last 30 days`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const leftMargin = 50;
    let y = 50;

    const drawHeader = () => {
      doc.fontSize(20).font('Helvetica-Bold');
      doc.text('UniSupport Report', leftMargin, y, { align: 'center' });
      y = doc.y + 10;
      doc.fontSize(14).font('Helvetica');
      doc.text(displayType, { align: 'center' });
      doc.fontSize(10);
      doc.text(`Period: ${period}`, { align: 'center' });
      y = doc.y + 10;
      doc.moveTo(leftMargin, y).lineTo(545, y).stroke();
      y += 15;
    };

    const drawFooter = () => {
      const now = new Date();
      doc.fontSize(8).font('Helvetica');
      doc.text(`Generated: ${now.toISOString().slice(0, 19).replace('T', ' ')}`, leftMargin, 780, {
        align: 'center',
      });
    };

    const drawTableRow = (cols: string[], yPos: number, bold = false) => {
      const colX = [50, 150, 250, 350, 450];
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      cols.forEach((col, i) => {
        doc.text(col, colX[i] || colX[colX.length - 1], yPos);
      });
    };

    const drawTableHeader = (cols: string[], yPos: number) => {
      drawTableRow(cols, yPos, true);
      const lineY = yPos + 14;
      doc.moveTo(leftMargin, lineY).lineTo(545, lineY).stroke();
      return yPos + 20;
    };

    drawHeader();

    switch (type) {
      case 'ticket-volume': {
        const report = await this.ticketVolume(startDate, endDate);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Total Tickets: ${report.total}`, leftMargin, y);
        y = doc.y + 10;

        y = drawTableHeader(['Date', 'Total', 'Open', 'Resolved', 'Closed'], y);
        for (const d of report.byDate) {
          if (y > 740) {
            doc.addPage();
            y = 50;
          }
          drawTableRow(
            [d.date, String(d.total), String(d.open), String(d.resolved), String(d.closed)],
            y,
          );
          y += 16;
        }
        break;
      }
      case 'sla': {
        const report = await this.slaCompliance(startDate, endDate);
        y = drawTableHeader(['Metric', 'Met', 'Breached', 'Total', 'Rate'], y);
        const slaRows = [
          [
            'Response SLA',
            String(report.response.met),
            String(report.response.breached),
            String(report.response.total),
            `${report.response.complianceRate}%`,
          ],
          [
            'Resolution SLA',
            String(report.resolution.met),
            String(report.resolution.breached),
            String(report.resolution.total),
            `${report.resolution.complianceRate}%`,
          ],
        ];
        for (const row of slaRows) {
          drawTableRow(row, y);
          y += 16;
        }
        break;
      }
      case 'agent-performance': {
        const report = await this.agentPerformance(startDate, endDate);
        y = drawTableHeader(
          ['Agent', 'Total', 'Resolved', 'Open', 'Avg Res (min)', 'Logged (min)'],
          y,
        );
        for (const a of report) {
          if (y > 730) {
            doc.addPage();
            y = 50;
          }
          drawTableRow(
            [
              a.agentName,
              String(a.totalTickets),
              String(a.resolved),
              String(a.open),
              String(a.avgResolutionMinutes),
              String(a.totalLoggedMinutes),
            ],
            y,
          );
          y += 16;
        }
        break;
      }
      case 'csat': {
        const report = await this.csat(startDate, endDate);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Average Rating: ${report.averageRating?.toFixed(2) ?? 'N/A'}`, leftMargin, y);
        y = doc.y + 8;
        doc.text(`Total Responses: ${report.totalResponses}`, leftMargin, y);
        y = doc.y + 12;

        const dist = report.distribution as Record<string, number>;
        const distKeys = Object.keys(dist).sort((a, b) => Number(a) - Number(b));
        if (distKeys.length > 0) {
          y = drawTableHeader(['Rating', 'Count'], y);
          for (const rating of distKeys) {
            drawTableRow([String(rating), String(dist[rating])], y);
            y += 16;
          }
          y += 10;
        }

        if (report.recentRatings?.length > 0) {
          if (y > 680) {
            doc.addPage();
            y = 50;
          }
          doc.fontSize(11).font('Helvetica-Bold');
          doc.text('Recent Ratings', leftMargin, y);
          y += 18;
          y = drawTableHeader(['Rating', 'Feedback', 'Ticket', 'Date'], y);
          for (const r of report.recentRatings) {
            if (y > 730) {
              doc.addPage();
              y = 50;
            }
            drawTableRow(
              [
                String(r.rating),
                (r.feedback || '').slice(0, 40),
                r.ticket?.subject?.slice(0, 30) ?? '',
                new Date(r.createdAt).toISOString().slice(0, 10),
              ],
              y,
            );
            y += 16;
          }
        }
        break;
      }
      default:
        doc.end();
        return Buffer.concat(buffers);
    }

    drawFooter();
    doc.end();

    return Buffer.concat(buffers);
  }
}

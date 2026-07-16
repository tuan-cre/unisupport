import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, roleName: string | null) {
    roleName = roleName ?? 'user';

    const [totalTickets, ticketsByStatus, ticketsByPriority, recentTickets] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      this.prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          requester: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const stats: Record<string, unknown> = {
      totalTickets,
      ticketsByStatus: Object.fromEntries(ticketsByStatus.map((s) => [s.status, s._count.id])),
      ticketsByPriority: Object.fromEntries(
        ticketsByPriority.map((p) => [p.priority, p._count.id]),
      ),
      recentTickets,
    };

    if (roleName === 'agent') {
      const [myAssigned, myAssignedByStatus] = await Promise.all([
        this.prisma.ticket.count({ where: { assigneeId: userId } }),
        this.prisma.ticket.groupBy({
          by: ['status'],
          where: { assigneeId: userId },
          _count: { id: true },
        }),
      ]);
      stats.myAssigned = myAssigned;
      stats.myAssignedByStatus = Object.fromEntries(
        myAssignedByStatus.map((s) => [s.status, s._count.id]),
      );
    }

    if (roleName === 'admin') {
      const [totalUsers, totalAgents, totalDepartments] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { role: { name: 'agent' } },
        }),
        this.prisma.department.count(),
      ]);
      stats.totalUsers = totalUsers;
      stats.totalAgents = totalAgents;
      stats.totalDepartments = totalDepartments;
    }

    return stats;
  }
}

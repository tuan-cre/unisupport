import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaDto } from './dto/create-sla.dto';
import { UpdateSlaDto } from './dto/update-sla.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

export interface SlaStatus {
  responseDeadline: Date | null;
  resolutionDeadline: Date | null;
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseRemainingMs: number | null;
  resolutionRemainingMs: number | null;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
}

@Injectable()
export class SlasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sla.findMany({
      include: { calendar: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sla = await this.prisma.sla.findUnique({
      where: { id },
      include: { calendar: true },
    });
    if (!sla) throw new NotFoundException('SLA not found');
    return sla;
  }

  async create(dto: CreateSlaDto) {
    if (dto.isDefault === true) {
      await this.prisma.sla.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.sla.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateSlaDto) {
    await this.findOne(id);
    if (dto.isDefault === true) {
      await this.prisma.sla.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.sla.update({ where: { id }, data: dto as any, include: { calendar: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sla.delete({ where: { id } });
    return { message: 'SLA deleted' };
  }

  // Calendars
  async findAllCalendars() {
    return this.prisma.slaCalendar.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findCalendar(id: string) {
    const cal = await this.prisma.slaCalendar.findUnique({
      where: { id },
      include: { slas: true },
    });
    if (!cal) throw new NotFoundException('Calendar not found');
    return cal;
  }

  async createCalendar(dto: CreateCalendarDto) {
    return this.prisma.slaCalendar.create({
      data: { ...dto, hoursJson: dto.hoursJson ?? '{}' },
    });
  }

  async updateCalendar(id: string, dto: UpdateCalendarDto) {
    await this.findCalendar(id);
    return this.prisma.slaCalendar.update({ where: { id }, data: dto });
  }

  async removeCalendar(id: string) {
    await this.findCalendar(id);
    const count = await this.prisma.sla.count({ where: { calendarId: id } });
    if (count > 0) {
      throw new ConflictException('Cannot delete calendar with linked SLA policies');
    }
    await this.prisma.slaCalendar.delete({ where: { id } });
    return { message: 'Calendar deleted' };
  }

  async resolveSlaForTicket(
    priority: string,
  ): Promise<{ id: string; name: string; responseTime: number; resolutionTime: number } | null> {
    let sla = await this.prisma.sla.findFirst({ where: { priority: priority as any } });
    if (!sla) {
      sla = await this.prisma.sla.findFirst({ where: { isDefault: true } });
    }
    if (!sla) return null;
    return {
      id: sla.id,
      name: sla.name,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
    };
  }

  computeSlaStatus(
    ticket: {
      createdAt: Date;
      firstResponseAt: Date | null;
      resolvedAt: Date | null;
      closedAt: Date | null;
    },
    sla: { responseTime: number; resolutionTime: number } | null,
  ): SlaStatus {
    if (!sla) {
      return {
        responseDeadline: null,
        resolutionDeadline: null,
        responseBreached: false,
        resolutionBreached: false,
        responseRemainingMs: null,
        resolutionRemainingMs: null,
        firstResponseAt: ticket.firstResponseAt,
        resolvedAt: ticket.resolvedAt,
        closedAt: ticket.closedAt,
      };
    }

    const now = new Date();
    const responseDeadline = new Date(ticket.createdAt.getTime() + sla.responseTime * 60 * 1000);
    const resolutionDeadline = new Date(
      ticket.createdAt.getTime() + sla.resolutionTime * 60 * 1000,
    );

    let responseBreached = false;
    let resolutionBreached = false;

    if (ticket.firstResponseAt) {
      responseBreached = ticket.firstResponseAt > responseDeadline;
    } else {
      responseBreached = now > responseDeadline;
    }

    if (ticket.resolvedAt) {
      resolutionBreached = ticket.resolvedAt > resolutionDeadline;
    } else if (ticket.closedAt) {
      resolutionBreached = ticket.closedAt > resolutionDeadline;
    } else {
      resolutionBreached = now > resolutionDeadline;
    }

    return {
      responseDeadline,
      resolutionDeadline,
      responseBreached,
      resolutionBreached,
      responseRemainingMs: ticket.firstResponseAt
        ? null
        : Math.max(0, responseDeadline.getTime() - now.getTime()),
      resolutionRemainingMs:
        ticket.resolvedAt || ticket.closedAt
          ? null
          : Math.max(0, resolutionDeadline.getTime() - now.getTime()),
      firstResponseAt: ticket.firstResponseAt,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
    };
  }
}

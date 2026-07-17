import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlasService } from '../slas/slas.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListTicketsQueryDto } from './dto/list-tickets.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { CreateRelationDto } from './dto/relation.dto';
import { CreateTimeEntryDto } from './dto/time-entry.dto';
import {
  ticketsCreatedCounter,
  commentsAddedCounter,
  ticketResolutionHistogram,
} from '../metrics/metrics.module';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private ns: NotificationsService,
    private slas: SlasService,
  ) {}

  private ticketInclude = {
    requester: { select: { id: true, firstName: true, lastName: true, email: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
    department: { select: { id: true, name: true } },
    sla: { select: { id: true, name: true, responseTime: true, resolutionTime: true } },
    tags: { include: { tag: true } },
    attachments: {
      select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
    },
  } as const;

  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    OPEN: ['IN_PROGRESS', 'PENDING', 'RESOLVED'],
    IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
    PENDING: ['IN_PROGRESS', 'RESOLVED', 'OPEN'],
    RESOLVED: ['CLOSED', 'OPEN'],
    CLOSED: ['OPEN'],
  };

  private async logHistory(
    ticketId: string,
    userId: string,
    field: string,
    oldValue?: string,
    newValue?: string,
  ) {
    if (oldValue === newValue) return;
    await this.prisma.ticketHistory.create({
      data: { ticketId, userId, field, oldValue: oldValue ?? null, newValue: newValue ?? null },
    });
  }

  async create(dto: CreateTicketDto, requesterId: string) {
    const defaultSla = await this.prisma.sla.findFirst({
      where: { isDefault: true },
    });

    const data: any = {
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority ?? 'MEDIUM',
      type: dto.type ?? null,
      departmentId: dto.departmentId ?? null,
      requesterId,
      slaId: defaultSla?.id ?? null,
    };

    if (!defaultSla && dto.priority) {
      const prioritySla = await this.prisma.sla.findFirst({
        where: { priority: dto.priority },
      });
      if (prioritySla) {
        data.slaId = prioritySla.id;
      }
    }

    if (dto.tagIds?.length) {
      data.tags = { create: dto.tagIds.map((tagId) => ({ tagId })) };
    }

    const ticket = await this.prisma.ticket.create({
      data,
      include: this.ticketInclude,
    });

    this.ns.onTicketCreated({
      id: ticket.id,
      subject: ticket.subject,
      requesterId: ticket.requesterId,
      requesterEmail: ticket.requester.email,
    });

    ticketsCreatedCounter.inc({
      priority: ticket.priority,
      department: ticket.departmentId ?? 'none',
    });

    return ticket;
  }

  async findAll(userId: string, userRole: string | null, query: ListTicketsQueryDto) {
    const isAdminOrAgent = userRole === 'admin' || userRole === 'agent';
    const where: Record<string, unknown> = isAdminOrAgent ? {} : { requesterId: userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.q) {
      where.OR = [
        { subject: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: this.ticketInclude,
      }),
      this.prisma.ticket.count({ where: where as any }),
    ]);

    const enriched = tickets.map((t) => ({
      ...t,
      slaStatus: this.slas.computeSlaStatus(t, t.sla ?? null),
    }));

    return {
      data: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string, userRole: string | null) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        ...this.ticketInclude,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        watchers: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        relatedFrom: {
          include: {
            fromTicket: { select: { id: true, subject: true, status: true } },
          },
        },
        relatedTo: {
          include: {
            toTicket: { select: { id: true, subject: true, status: true } },
          },
        },
        timeEntries: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const isAdminOrAgent = userRole === 'admin' || userRole === 'agent';
    if (!isAdminOrAgent && ticket.requesterId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const comments =
      userRole !== 'admin' && userRole !== 'agent'
        ? ticket.comments.filter((c) => !c.isInternal)
        : ticket.comments;

    const myRating = await this.prisma.ticketRating.findUnique({
      where: { ticketId_userId: { ticketId: id, userId } },
      select: { rating: true, feedback: true, createdAt: true },
    });

    return {
      ...ticket,
      comments,
      myRating,
      slaStatus: this.slas.computeSlaStatus(ticket, ticket.sla),
    };
  }

  async update(id: string, dto: UpdateTicketDto, userId: string, userRole: string | null) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const isAdminOrAgent = userRole === 'admin' || userRole === 'agent';
    const isOwner = ticket.requesterId === userId;

    if (!isAdminOrAgent && !isOwner) {
      throw new ForbiddenException('Access denied');
    }

    if (!isAdminOrAgent && dto.assigneeId) {
      throw new ForbiddenException('Only agents can assign tickets');
    }

    if (dto.status && dto.status !== ticket.status) {
      const allowed = TicketsService.VALID_TRANSITIONS[ticket.status];
      if (!allowed?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${ticket.status} to ${dto.status}. Allowed: ${allowed?.join(', ') ?? 'none'}`,
        );
      }
    }

    const updateData: any = { ...dto };
    if (dto.tagIds !== undefined) {
      const currentTags = await this.prisma.ticketTag.findMany({
        where: { ticketId: id },
        select: { tagId: true },
      });
      const currentIds = currentTags.map((t) => t.tagId);
      const toRemove = currentIds.filter((tid) => !dto.tagIds!.includes(tid));
      const toAdd = dto.tagIds.filter((tid) => !currentIds.includes(tid));
      updateData.tags = {
        deleteMany: { tagId: { in: toRemove } },
        create: toAdd.map((tagId) => ({ tagId })),
      };
      delete updateData.tagIds;
    }

    // Track SLA timestamps on status changes
    if (dto.status && dto.status !== ticket.status) {
      if (dto.status === 'RESOLVED' && !ticket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (dto.status === 'CLOSED' && !ticket.closedAt) {
        updateData.closedAt = new Date();
      }
      if (dto.status !== 'OPEN' && dto.status !== 'RESOLVED' && dto.status !== 'CLOSED') {
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: this.ticketInclude,
    });

    // Audit logging
    const changes: { field: string; oldValue?: string; newValue?: string }[] = [];
    if (dto.status && dto.status !== ticket.status)
      changes.push({ field: 'status', oldValue: ticket.status, newValue: dto.status });
    if (dto.priority && dto.priority !== ticket.priority)
      changes.push({ field: 'priority', oldValue: ticket.priority, newValue: dto.priority });
    if (dto.assigneeId && dto.assigneeId !== ticket.assigneeId)
      changes.push({
        field: 'assignee',
        oldValue: ticket.assigneeId ?? undefined,
        newValue: dto.assigneeId,
      });
    if (dto.departmentId !== undefined && dto.departmentId !== ticket.departmentId)
      changes.push({
        field: 'department',
        oldValue: ticket.departmentId ?? undefined,
        newValue: dto.departmentId ?? undefined,
      });
    if (dto.subject && dto.subject !== ticket.subject)
      changes.push({ field: 'subject', oldValue: ticket.subject, newValue: dto.subject });
    if (dto.type !== undefined && dto.type !== (ticket as any).type)
      changes.push({
        field: 'type',
        oldValue: (ticket as any).type ?? undefined,
        newValue: dto.type ?? undefined,
      });

    for (const c of changes) {
      await this.logHistory(id, userId, c.field, c.oldValue, c.newValue);
    }

    if (dto.assigneeId && dto.assigneeId !== ticket.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
        select: { id: true, email: true },
      });
      if (assignee) {
        this.ns.onTicketAssigned({
          id: ticket.id,
          subject: ticket.subject,
          assigneeId: assignee.id,
          assigneeEmail: assignee.email,
        });
      }
    }

    if (dto.status && dto.status !== ticket.status) {
      this.ns.onTicketStatusChanged({
        id: ticket.id,
        subject: ticket.subject,
        status: dto.status,
        requesterId: ticket.requester.id,
        requesterEmail: ticket.requester.email,
      });
    }

    return updated;
  }

  async addComment(
    ticketId: string,
    dto: CreateCommentDto,
    authorId: string,
    userRole: string | null,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        subject: true,
        requesterId: true,
        firstResponseAt: true,
        requester: { select: { email: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (userRole !== 'admin' && userRole !== 'agent' && ticket.requesterId !== authorId) {
      throw new ForbiddenException('Access denied');
    }

    const isAgentAdmin = userRole === 'admin' || userRole === 'agent';
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        isInternal: dto.isInternal === true && isAgentAdmin,
        ticketId,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    commentsAddedCounter.inc({ ticket_type: isAgentAdmin ? 'agent' : 'requester' });

    // Set firstResponseAt if an agent/admin responds for the first time
    if (isAgentAdmin && !dto.isInternal && !ticket.firstResponseAt) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }

    if (!dto.isInternal) {
      this.ns.onCommentAdded(
        {
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          authorId,
          content: dto.content,
        },
        ticket.requesterId,
        ticket.requester.email,
      );
    }

    return comment;
  }

  // Tags
  async createTag(dto: { name: string; color?: string }) {
    return this.prisma.tag.create({ data: dto });
  }

  async findAllTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  // Watchers
  async addWatcher(ticketId: string, watcherUserId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.ticketWatcher.upsert({
      where: { ticketId_userId: { ticketId, userId: watcherUserId } },
      create: { ticketId, userId: watcherUserId },
      update: {},
    });
  }

  async removeWatcher(ticketId: string, watcherUserId: string) {
    await this.prisma.ticketWatcher.deleteMany({
      where: { ticketId, userId: watcherUserId },
    });
  }

  // Relations
  async addRelation(ticketId: string, dto: CreateRelationDto) {
    const [from, to] = await Promise.all([
      this.prisma.ticket.findUnique({ where: { id: ticketId }, select: { id: true } }),
      this.prisma.ticket.findUnique({ where: { id: dto.ticketId }, select: { id: true } }),
    ]);
    if (!from) throw new NotFoundException('Source ticket not found');
    if (!to) throw new NotFoundException('Target ticket not found');
    return this.prisma.ticketRelation.create({
      data: {
        fromTicketId: ticketId,
        toTicketId: dto.ticketId,
        type: dto.type ?? 'related',
      },
    });
  }

  async removeRelation(relationId: string) {
    await this.prisma.ticketRelation.delete({ where: { id: relationId } });
  }

  // Time entries
  async addTimeEntry(ticketId: string, dto: CreateTimeEntryDto, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.timeEntry.create({
      data: { ticketId, userId, minutes: dto.minutes, description: dto.description ?? null },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // Bulk operations
  async bulkUpdate(dto: BulkUpdateDto, userId: string, userRole: string | null) {
    const isAdminOrAgent = userRole === 'admin' || userRole === 'agent';
    if (!isAdminOrAgent)
      throw new ForbiddenException('Only admins and agents can bulk update tickets');

    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.priority) data.priority = dto.priority;
    if (dto.assigneeId !== undefined) data.assigneeId = dto.assigneeId;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId;

    if (Object.keys(data).length === 0) return { count: 0 };

    if (dto.status) {
      if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
      if (dto.status === 'CLOSED') data.closedAt = new Date();
    }

    const result = await this.prisma.ticket.updateMany({
      where: { id: { in: dto.ids } },
      data,
    });
    return { count: result.count };
  }

  // Templates
  async createTemplate(dto: {
    name: string;
    subject: string;
    description: string;
    priority?: any;
    departmentId?: string;
  }) {
    return this.prisma.ticketTemplate.create({ data: dto });
  }

  async findAllTemplates() {
    return this.prisma.ticketTemplate.findMany({
      include: { department: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateTemplate(id: string, dto: any) {
    return this.prisma.ticketTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(id: string) {
    await this.prisma.ticketTemplate.delete({ where: { id } });
  }

  async attachFile(ticketId: string, attachmentId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { ticketId },
    });
  }

  async rateTicket(ticketId: string, userId: string, rating: number, feedback?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.requesterId !== userId) {
      throw new ForbiddenException('Only the ticket requester can rate');
    }
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    return this.prisma.ticketRating.upsert({
      where: { ticketId_userId: { ticketId, userId } },
      update: { rating, feedback },
      create: { ticketId, userId, rating, feedback },
    });
  }
}

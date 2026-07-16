import { Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private events: EventsGateway,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') ?? 'localhost',
      port: this.config.get<number>('SMTP_PORT') ?? 1025,
      ignoreTLS: true,
    });
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });
    this.events.notifyUser(data.userId, 'notification', notification);
    return notification;
  }

  async createAndEmail(
    userId: string,
    email: string,
    data: { type: string; title: string; message: string; link?: string },
  ) {
    const notification = await this.create({ userId, ...data });
    this.sendEmail(email, data.title, data.message, data.link);
    return notification;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Notification not found');
    return result;
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  private sendEmail(to: string, subject: string, text: string, link?: string) {
    const html = `
      <!DOCTYPE html>
      <html><body style="font-family:sans-serif;padding:24px;max-width:480px">
        <h2 style="color:#1e3a5f">UniSupport</h2>
        <p>${text}</p>
        ${link ? `<p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">View details</a></p>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin-top:24px" />
        <p style="font-size:12px;color:#94a3b8">UniSupport — University IT Help Desk</p>
      </body></html>
    `;
    this.transporter
      .sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? 'unisupport@localhost',
        to,
        subject,
        text,
        html,
      })
      .catch((err) => console.error('Email send failed:', err.message));
  }

  async onTicketCreated(ticket: {
    id: string;
    subject: string;
    requesterId: string;
    requesterEmail: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { name: 'admin' } },
      select: { id: true, email: true },
    });
    const agents = await this.prisma.user.findMany({
      where: { role: { name: 'agent' } },
      select: { id: true, email: true },
    });
    const recipients = [
      ...admins.map((u) => ({ id: u.id, email: u.email })),
      ...agents.map((u) => ({ id: u.id, email: u.email })),
    ].filter((r) => r.id !== ticket.requesterId);

    const link = `/tickets/${ticket.id}`;
    if (recipients.length > 0) {
      await this.prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.id,
          type: 'ticket_created',
          title: 'New ticket',
          message: ticket.subject,
          link,
        })),
      });
      for (const r of recipients) {
        this.events.notifyUser(r.id, 'notification', { type: 'ticket_created', title: 'New ticket', message: ticket.subject });
      }
    }

    await this.createAndEmail(ticket.requesterId, ticket.requesterEmail, {
      type: 'ticket_created',
      title: 'Ticket created',
      message: `Your ticket "${ticket.subject}" has been created.`,
      link,
    });
  }

  async onTicketAssigned(ticket: {
    id: string;
    subject: string;
    assigneeId: string;
    assigneeEmail: string;
  }) {
    const link = `/tickets/${ticket.id}`;
    await this.createAndEmail(ticket.assigneeId, ticket.assigneeEmail, {
      type: 'ticket_assigned',
      title: 'Ticket assigned',
      message: `Ticket "${ticket.subject}" has been assigned to you.`,
      link,
    });
  }

  async onTicketStatusChanged(ticket: {
    id: string;
    subject: string;
    status: string;
    requesterId: string;
    requesterEmail: string;
  }) {
    const link = `/tickets/${ticket.id}`;
    await this.createAndEmail(ticket.requesterId, ticket.requesterEmail, {
      type: 'status_changed',
      title: 'Status updated',
      message: `Ticket "${ticket.subject}" is now ${ticket.status.replace('_', ' ')}.`,
      link,
    });
  }

  async onCommentAdded(
    comment: { ticketId: string; ticketSubject: string; authorId: string; content: string },
    requesterId: string,
    requesterEmail: string,
  ) {
    const link = `/tickets/${comment.ticketId}`;
    if (requesterId !== comment.authorId) {
      await this.createAndEmail(requesterId, requesterEmail, {
        type: 'comment_added',
        title: 'New comment',
        message: `New comment on "${comment.ticketSubject}": ${comment.content.slice(0, 100)}`,
        link,
      });
    }
  }
}

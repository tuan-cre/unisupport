import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  // --- Conversations ---
  async createConversation(data: {
    subject?: string;
    visitorName?: string;
    visitorEmail?: string;
    userId?: string;
  }) {
    return this.prisma.chatConversation.create({
      data: {
        subject: data.subject ?? 'Chat',
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
        userId: data.userId,
      },
      include: { messages: true },
    });
  }

  async getConversation(id: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async listConversations(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.chatConversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.chatConversation.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // --- Messages ---
  async addMessage(
    conversationId: string,
    data: { content: string; senderType: string; senderId?: string; senderName?: string },
  ) {
    const conv = await this.prisma.chatConversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.status === 'CLOSED') throw new BadRequestException('Conversation is closed');

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    const message = await this.prisma.chatMessage.create({
      data: { conversationId, ...data },
    });

    this.events.emitChatMessage(conversationId, message);
    this.events.emitChatNotification({
      conversationId,
      message,
      conversation: { subject: conv.subject, visitorName: conv.visitorName },
    });

    return message;
  }

  async closeConversation(id: string) {
    await this.getConversation(id);
    return this.prisma.chatConversation.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  // --- Convert to ticket ---
  async convertToTicket(conversationId: string, subject?: string, departmentId?: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.ticketId) throw new BadRequestException('Already converted to a ticket');

    const msgText = conv.messages
      .map((m) => `[${m.senderType}] ${m.senderName || m.senderType}: ${m.content}`)
      .join('\n');
    const description = `Chat conversation #${conv.id.slice(0, 8)}\n\n${msgText}`;

    let requesterId = conv.userId;
    if (!requesterId && conv.visitorEmail) {
      const guest = await this.prisma.user.findFirst({
        where: { email: conv.visitorEmail },
      });
      if (guest) {
        requesterId = guest.id;
      }
    }
    if (!requesterId) {
      throw new BadRequestException(
        'Cannot create ticket: no registered user linked to this conversation',
      );
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        subject: subject ?? conv.subject ?? 'Chat conversation',
        description,
        requesterId,
        departmentId: departmentId ?? undefined,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { ticketId: ticket.id, status: 'CLOSED' },
    });

    return ticket;
  }

  // --- Visitor message fetch (by email) ---
  async getConversationByEmail(id: string, email: string) {
    const conv = await this.prisma.chatConversation.findFirst({
      where: { id, visitorEmail: email },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // --- Inbound Email ---
  async processInboundEmail(dto: {
    from: string;
    subject: string;
    body: string;
    references?: string;
    inReplyTo?: string;
  }) {
    // Try to match by ticket ID in subject or references
    const ticketIdMatch =
      dto.references?.match(/ticket-([a-z0-9]+)/i) ||
      dto.inReplyTo?.match(/ticket-([a-z0-9]+)/i) ||
      dto.subject?.match(/\[#(\w+)\]/);
    const existingTicketId = ticketIdMatch?.[1];

    if (existingTicketId) {
      // Reply to existing ticket
      const ticket = await this.prisma.ticket.findUnique({ where: { id: existingTicketId } });
      if (!ticket) throw new NotFoundException('Referenced ticket not found');

      const user = await this.prisma.user.findUnique({ where: { email: dto.from } });
      if (!user) throw new NotFoundException('User not found for email');

      const comment = await this.prisma.comment.create({
        data: { content: `[Email reply]\n${dto.body}`, ticketId: ticket.id, authorId: user.id },
      });
      return { type: 'reply', ticketId: ticket.id, commentId: comment.id };
    }

    // Create new ticket
    const user = await this.prisma.user.findUnique({ where: { email: dto.from } });
    if (!user) {
      // Create as chat conversation for unknown users
      const conv = await this.createConversation({
        subject: dto.subject,
        visitorEmail: dto.from,
        visitorName: dto.from.split('@')[0],
      });
      await this.addMessage(conv.id, {
        content: dto.body,
        senderType: 'VISITOR',
        senderName: dto.from,
      });
      return { type: 'conversation', conversationId: conv.id };
    }

    const ticket = await this.prisma.ticket.create({
      data: { subject: dto.subject, description: dto.body, requesterId: user.id },
    });
    return { type: 'ticket', ticketId: ticket.id };
  }
}

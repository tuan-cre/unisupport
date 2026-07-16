import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from '../tickets/tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SlasService } from '../slas/slas.service';

const mockPrisma = {
  ticket: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  tag: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  ticketWatcher: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  ticketRelation: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  timeEntry: {
    create: jest.fn(),
  },
  ticketHistory: {
    create: jest.fn(),
  },
  ticketTemplate: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  attachment: {
    update: jest.fn(),
  },
  comment: {
    create: jest.fn(),
  },
  sla: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((queries: any[]) => Promise.all(queries)),
};

const mockNs = {
  onTicketCreated: jest.fn(),
  onTicketAssigned: jest.fn(),
  onTicketStatusChanged: jest.fn(),
  onCommentAdded: jest.fn(),
};

const mockSlas = {
  computeSlaStatus: jest.fn().mockReturnValue({
    responseDeadline: null,
    resolutionDeadline: null,
    responseBreached: false,
    resolutionBreached: false,
    responseRemainingMs: null,
    resolutionRemainingMs: null,
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
  }),
};

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNs },
        { provide: SlasService, useValue: mockSlas },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ticket', async () => {
      const dto = { subject: 'Test', description: 'Test desc', priority: 'MEDIUM' as const };
      const requesterId = 'user-id';
      const mockTicket = { id: 'ticket-id', ...dto, requesterId };

      mockPrisma.sla.findFirst.mockResolvedValue(null);
      mockPrisma.ticket.create.mockResolvedValue({
        ...mockTicket,
        requester: { email: 'test@test.com' },
        tags: [],
        attachments: [],
        department: null,
        assignee: null,
        sla: null,
      });

      const result = await service.create(dto, requesterId);
      expect(result).toMatchObject(expect.objectContaining({ id: 'ticket-id' }));
      expect(prisma.ticket.create).toHaveBeenCalled();
      expect(mockNs.onTicketCreated).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const mockTickets = [
        {
          id: '1',
          subject: 'Test',
          description: 'Desc',
          status: 'OPEN',
          priority: 'MEDIUM',
          requesterId: 'u1',
          requester: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
          tags: [],
          attachments: [],
          department: null,
          assignee: null,
          sla: null,
        },
      ];

      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.ticket.count.mockResolvedValue(1);

      const result = await service.findAll('admin-id', 'admin', { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});

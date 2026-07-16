import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

const mockPrisma = {
  chatConversation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  chatMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  ticket: {
    create: jest.fn(),
  },
  $transaction: jest.fn((queries: any[]) => Promise.all(queries)),
};

const mockEvents = {
  emitChatMessage: jest.fn(),
  emitChatNotification: jest.fn(),
};

describe('ChatService', () => {
  let service: ChatService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a conversation with visitor data', async () => {
      const data = {
        visitorName: 'John',
        visitorEmail: 'john@test.com',
      };
      const mockConv = { id: 'conv-id', ...data, messages: [] };
      mockPrisma.chatConversation.create.mockResolvedValue(mockConv);

      const result = await service.createConversation(data);
      expect(result).toEqual(mockConv);
      expect(prisma.chatConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ visitorName: 'John', visitorEmail: 'john@test.com' }),
        }),
      );
    });
  });

  describe('addMessage', () => {
    it('should create a message and emit WS events', async () => {
      const conv = { id: 'conv-id', subject: 'Chat', status: 'ACTIVE', visitorName: 'John' };
      mockPrisma.chatConversation.findUnique.mockResolvedValue(conv);
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 'msg-id', content: 'Hello', senderType: 'VISITOR' });

      const result = await service.addMessage('conv-id', {
        content: 'Hello',
        senderType: 'VISITOR',
      });

      expect(result).toHaveProperty('id');
      expect(mockEvents.emitChatMessage).toHaveBeenCalledWith('conv-id', expect.any(Object));
      expect(mockEvents.emitChatNotification).toHaveBeenCalled();
    });

    it('should throw on closed conversation', async () => {
      mockPrisma.chatConversation.findUnique.mockResolvedValue({ status: 'CLOSED' });
      await expect(
        service.addMessage('conv-id', { content: 'Hi', senderType: 'VISITOR' }),
      ).rejects.toThrow();
    });
  });

  describe('listConversations', () => {
    it('should return paginated conversations', async () => {
      mockPrisma.chatConversation.findMany.mockResolvedValue([]);
      mockPrisma.chatConversation.count.mockResolvedValue(0);

      const result = await service.listConversations();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });
});

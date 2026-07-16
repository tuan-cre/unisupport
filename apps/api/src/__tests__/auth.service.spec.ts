import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'mock-secret'),
  verify: jest.fn(() => true),
  generateURI: jest.fn(() => 'otpauth://totp/UniSupport:test?secret=mock'),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      WEB_ORIGIN: 'http://localhost:5173',
    };
    return map[key];
  }),
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      WEB_ORIGIN: 'http://localhost:5173',
    };
    return map[key];
  }),
};

const mockNs = {
  onTicketCreated: jest.fn(),
  onTicketAssigned: jest.fn(),
  onTicketStatusChanged: jest.fn(),
  onCommentAdded: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: NotificationsService, useValue: mockNs },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a user with hashed password', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'StrongP@ss1',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockRole = { id: 'role-id', name: 'user', permissions: [] };

      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: mockRole,
      });

      const result = await service.register(dto);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
          }),
        }),
      );
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('me', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: { id: 'role-id', name: 'user', permissions: [] },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.me('user-id');
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-id' } }),
      );
    });
  });
});

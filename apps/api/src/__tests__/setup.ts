import { Test, TestingModule } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'mock-secret'),
  verify: jest.fn(() => true),
  generateURI: jest.fn(() => 'otpauth://totp/UniSupport:test?secret=mock'),
  authenticator: { generateToken: jest.fn(() => '123456') },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

jest.mock('@scure/base', () => ({
  bytesToHex: jest.fn((b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')),
  hexToBytes: jest.fn((s: string) => new Uint8Array(s.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [])),
}));

export const JWT_SECRET = 'test-secret';

export const mockPrisma = {
  ticket: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    $transaction: jest.fn().mockImplementation((queries: any[]) => Promise.all(queries)),
  },
  ticketRating: {
    aggregate: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
  },
  ticketWatcher: { upsert: jest.fn(), deleteMany: jest.fn() },
  ticketRelation: { create: jest.fn(), delete: jest.fn() },
  timeEntry: { create: jest.fn() },
  ticketHistory: { create: jest.fn() },
  ticketTemplate: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
  attachment: { update: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  comment: { create: jest.fn() },
  sla: { findFirst: jest.fn() },
  tag: { create: jest.fn(), findMany: jest.fn() },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  role: { findUnique: jest.fn(), findMany: jest.fn() },
  article: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  articleCategory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((queries: any[]) => Promise.all(queries)),
  $queryRaw: jest.fn(),
};

export const mockNotifications = {
  onTicketCreated: jest.fn(),
  onTicketAssigned: jest.fn(),
  onTicketStatusChanged: jest.fn(),
  onCommentAdded: jest.fn(),
};

export function createTestJwt(payload: Record<string, any> = {}): string {
  const jwt = new JwtService({ secret: JWT_SECRET, signOptions: { algorithm: 'HS256' } });
  return jwt.sign({ sub: 'user-1', roleName: 'admin', ...payload });
}

export function bypassGuard(): any {
  return {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      const jwt = new JwtService({ secret: JWT_SECRET, signOptions: { algorithm: 'HS256' } });
      try {
        const decoded = jwt.decode(token) as any;
        req.user = decoded || { sub: 'user-1', roleName: 'admin', email: 'test@test.com', id: 'user-1' };
      } catch {
        req.user = { sub: 'user-1', roleName: 'admin', email: 'test@test.com', id: 'user-1' };
      }
      return true;
    },
  };
}

export interface SetupResult {
  app: INestApplication;
  api: ReturnType<typeof request>;
}

export async function setup(): Promise<SetupResult> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/nonexistent';
  process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  process.env.MINIO_ENDPOINT = 'localhost';
  process.env.MINIO_PORT = '9000';
  process.env.MINIO_ACCESS_KEY = 'minioadmin';
  process.env.MINIO_SECRET_KEY = 'minioadmin';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = JWT_SECRET;
  process.env.WEBHOOK_SECRET = 'test-webhook-secret-32chars-long';
  process.env.WEB_ORIGIN = 'http://localhost';
  process.env.PORT = '0';
  process.env.SMTP_FROM = 'test@test.com';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';

  jest.resetAllMocks();

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .overrideProvider(NotificationsService)
    .useValue(mockNotifications)
    .overrideGuard(JwtAuthGuard)
    .useValue(bypassGuard())
    .overrideGuard(RolesGuard)
    .useValue(bypassGuard())
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });
  await app.init();

  return {
    app,
    api: request(app.getHttpServer()),
  };
}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcrypt';

// Guard overrides to bypass actual auth checks but respect token role
function bypassGuard(): any {
  return {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      const jwt = new JwtService({
        secret: process.env.JWT_SECRET || 'test-secret',
        signOptions: { algorithm: 'HS256' },
      });
      try {
        const decoded = jwt.decode(token) as any;
        // Use decoded payload if present; fallback to a default admin-like user (for tests without token)
        req.user = decoded || {
          sub: 'user-1',
          roleName: 'admin',
          email: 'test@test.com',
          id: 'user-1',
        };
      } catch {
        req.user = { sub: 'user-1', roleName: 'admin', email: 'test@test.com', id: 'user-1' };
      }
      return true;
    },
  };
}

// Ensure test database exists in the Postgres container
async function ensureTestDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL!;
  // Derive connection to 'postgres' default DB
  const postgresUrl = dbUrl.replace(/\/[^/]+$/, '/postgres');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: postgresUrl } } });
  try {
    await prisma.$connect();
    const dbName = dbUrl.split('/').pop()!.split('?')[0];
    const res = await prisma.$queryRaw<[{ datname: string }]>(
      `SELECT datname FROM pg_database WHERE datname = ${dbName}`,
    );
    if (res.length === 0) {
      await prisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations against the test DB
async function runMigrations(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const { migrateDeploy } = await import('@prisma/migrate');
    await migrateDeploy({ prisma });
  } finally {
    await prisma.$disconnect();
  }
}

// Seed minimal test data required by the integration specs
async function seedTestData(prisma: any): Promise<void> {
  const plainPassword = 'Test123!';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  await prisma.user.upsert({
    where: { id: 'user-1' },
    create: {
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash,
      status: 'ACTIVE',
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: 'admin-1' },
    create: {
      id: 'admin-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      status: 'ACTIVE',
    },
    update: {},
  });

  await prisma.articleCategory.upsert({
    where: { id: 'cat-1' },
    create: {
      id: 'cat-1',
      name: 'Getting Started',
      slug: 'getting-started',
    },
    update: {},
  });

  // Create roles and assign to users (optional but safe)
  try {
    await prisma.role.upsert({
      where: { name: 'user' },
      create: { name: 'user', description: 'Regular user' },
      update: {},
    });
    await prisma.role.upsert({
      where: { name: 'admin' },
      create: { name: 'admin', description: 'Administrator' },
      update: {},
    });
    await prisma.user.update({
      where: { id: 'user-1' },
      data: { role: { connect: { name: 'user' } } },
    });
    await prisma.user.update({
      where: { id: 'admin-1' },
      data: { role: { connect: { name: 'admin' } } },
    });
  } catch (e) {
    // Ignore if roles already exist or constraints fail
  }
}

export async function setup(): Promise<{
  app: INestApplication;
  api: ReturnType<typeof request>;
  prisma: PrismaService;
}> {
  // Load .env.test
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.test' });

  // Ensure required env vars are present
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in .env.test');
  }

  // Prepare test DB
  await ensureTestDatabase();
  await runMigrations();

  // Build testing module without Prisma/Notifications overrides (real DB)
  const moduleFixture: TestingModule = Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
  })
    .overrideProvider(JwtAuthGuard)
    .useValue(bypassGuard())
    .overrideProvider(RolesGuard)
    .useValue(bypassGuard());

  const module = await moduleFixture.compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true });
  await app.init();

  const prisma = module.get<PrismaService>(PrismaService);
  await seedTestData(prisma);

  const api = request(app.getHttpServer());

  return { app, api, prisma };
}

export function createTestJwt(payload: Record<string, any> = {}): string {
  const jwt = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret',
    signOptions: { algorithm: 'HS256' },
  });
  return jwt.sign({ sub: 'user-1', roleName: 'admin', ...payload });
}

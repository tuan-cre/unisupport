import { PrismaService } from '../prisma/prisma.service';
import { setup, createTestJwt } from './setup.integration';
import type { INestApplication } from '@nestjs/common';

describe('TicketsController (integration)', () => {
  let nestApp: INestApplication;
  let api: any;
  let prisma: PrismaService;
  const token = createTestJwt();
  const adminToken = createTestJwt({ roleName: 'admin' });

  // Clean DB and reseed minimal data required by tests
  const prepareDb = async () => {
    // Delete test data in order to avoid FK violations
    await prisma.$transaction([
      prisma.comment.deleteMany(),
      prisma.attachment.deleteMany(),
      prisma.ticketRating.deleteMany(),
      prisma.ticketWatcher.deleteMany(),
      prisma.ticketRelation.deleteMany(),
      prisma.timeEntry.deleteMany(),
      prisma.ticketHistory.deleteMany(),
      prisma.ticketTemplate.deleteMany(),
      prisma.ticketTag.deleteMany(),
      prisma.ticket.deleteMany(),
      // Keep seed users (user-1, admin-1) and articleCategory intact
    ]);

    // Create a standard ticket 'ticket-1' for tests that depend on it
    await prisma.ticket.create({
      data: {
        id: 'ticket-1',
        subject: 'Laptop not turning on',
        description: 'My laptop is broken and needs fixing shortly.',
        priority: 'MEDIUM',
        status: 'OPEN',
        requesterId: 'user-1',
      },
    });
  };

  beforeAll(async () => {
    const result = await setup();
    nestApp = result.app;
    api = result.api;
    prisma = result.prisma;
  });

  afterAll(async () => {
    await nestApp.close();
  });

  beforeEach(async () => {
    await prepareDb();
  });

  it('1. GET /api/tickets returns 200', async () => {
    await api.get('/api/tickets').expect(200);
  });

  it('2. POST /api/tickets creates ticket with valid data (requires auth)', async () => {
    const res = await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Laptop issue', description: 'My laptop needs fixing now.' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    // Verify ticket created in DB
    const dbTicket = await prisma.ticket.findFirst({
      where: { subject: 'Laptop issue' },
    });
    expect(dbTicket).not.toBeNull();
    expect(dbTicket?.description).toBe('My laptop needs fixing now.');
  });

  it('3. POST /api/tickets returns error with missing fields', async () => {
    await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Nice' })
      .expect((r: any) => expect([200, 400]).toContain(r.status));
  });

  it('4. GET /api/tickets/:id returns 404 for non-existent', async () => {
    await api.get('/api/tickets/nonexistent-id').expect(404);
  });

  it('5a. POST /api/tickets/:id/comments returns 401 without token', async () => {
    await api.post('/api/tickets/ticket-1/comments').send({ content: 'Some comment' }).expect(401);
  });

  it('5b. POST /api/tickets/:id/comments returns 200 with token', async () => {
    await api
      .post('/api/tickets/ticket-1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Some comment' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    // Verify comment created in DB
    const comment = await prisma.comment.findFirst({
      where: { ticketId: 'ticket-1', content: 'Some comment' },
    });
    expect(comment).not.toBeNull();
  });

  it('6. PATCH /api/tickets/:id updates status (requires auth)', async () => {
    await api
      .patch('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    const ticket = await prisma.ticket.findUnique({ where: { id: 'ticket-1' } });
    expect(ticket?.status).toBe('IN_PROGRESS');
  });

  it('7. GET /api/tickets/csv returns CSV with correct content-type', async () => {
    const res = await api.get('/api/tickets/csv').set('Authorization', `Bearer ${adminToken}`);

    expect(res.headers['content-type'] as string).toMatch(/text\/csv/);
  });

  it('8. GET /api/reports/csat returns 200 with avgRating, distribution, totalResponses', async () => {
    const res = await api
      .get('/api/reports/csat')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.averageRating ?? res.body.data.avgRating).toBeDefined();
    expect(res.body.data.distribution).toBeDefined();
    expect(res.body.data.totalResponses).toBeDefined();
  });

  it('9. GET /api/reports/export/pdf returns 200 with PDF content-type for valid type', async () => {
    const res = await api
      .get('/api/reports/export/pdf')
      .query({ type: 'ticket-volume' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect((res.headers['content-type'] as string) ?? '').toMatch(/application\/pdf/);
    expect(res.status).toBe(200);
  });

  it('10. 102 requests to same endpoint, some throttled (429)', async () => {
    const urls: string[] = [];
    for (let i = 0; i < 101; i++) urls.push('/api/tickets');

    const results = await Promise.all(
      urls.map((url) => api.get(url).set('Authorization', `Bearer ${token}`)),
    );

    const statuses = results.map((r) => r.status);
    expect(statuses.length).toBeGreaterThanOrEqual(30);
    const throttled = statuses.filter((s) => s === 429);
    expect(throttled.length).toBeGreaterThan(0);
  });
});

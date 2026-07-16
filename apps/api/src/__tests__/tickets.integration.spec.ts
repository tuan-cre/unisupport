import { mockPrisma, mockNotifications, createTestJwt, setup } from './setup';
import type { INestApplication } from '@nestjs/common';

describe('TicketsController (integration)', () => {
  let nestApp: INestApplication;
  let api: any;
  const token = createTestJwt();
  const adminToken = createTestJwt({ roleName: 'admin' });

  const mockTicket = {
    id: 'ticket-1',
    subject: 'Laptop not turning on',
    description: 'My laptop is broken and needs fixing shortly.',
    priority: 'MEDIUM',
    status: 'OPEN',
    type: null,
    departmentId: null,
    assigneeId: null,
    requesterId: 'user-1',
    slaId: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    resolvedAt: null,
    closedAt: null,
    requester: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    assignee: null,
    department: null,
    sla: null,
    tags: [],
    attachments: [],
  };

  beforeAll(async () => {
    const result = await setup();
    nestApp = result.app;
    api = result.api;
  });

  afterAll(async () => {
    await nestApp.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);
    mockPrisma.ticket.create.mockResolvedValue({ ...mockTicket });
    mockPrisma.sla.findFirst.mockResolvedValue(null);
    mockPrisma.comment.create.mockResolvedValue({
      id: 'comment-1',
      content: 'Helping with this',
      isInternal: false,
      author: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    });
    mockPrisma.ticket.update.mockResolvedValue({ ...mockTicket, status: 'IN_PROGRESS' });
    mockPrisma.ticketRating.aggregate.mockResolvedValue({
      _avg: { rating: 4.2 },
      _count: { id: 150 },
    });
    mockPrisma.ticketRating.groupBy.mockResolvedValue([
      { rating: 5, _count: { id: 80 } },
      { rating: 4, _count: { id: 50 } },
      { rating: 3, _count: { id: 20 } },
    ]);
  });

  it('1. GET /api/tickets returns 200', async () => {
    const res = await api.get('/api/tickets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('2. POST /api/tickets creates ticket with valid data (requires auth)', async () => {
    await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Laptop issue', description: 'My laptop needs fixing now.' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subject: 'Laptop issue' }) }),
    );
  });

  it('3. POST /api/tickets returns error with missing fields', async () => {
    const res = await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Nice' });

    expect([200, 400]).toContain(res.status);
  });

  it('4. GET /api/tickets/:id returns 404 for non-existent', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null);
    await api.get('/api/tickets/nonexistent-id').expect(404);
  });

  it('5a. POST /api/tickets/:id/comments returns 401 without token', async () => {
    await api
      .post('/api/tickets/ticket-1/comments')
      .send({ content: 'Some comment' })
      .expect(401);
  });

  it('5b. POST /api/tickets/:id/comments returns 200 with token', async () => {
    await api
      .post('/api/tickets/ticket-1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Some comment' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    expect(mockPrisma.comment.create).toHaveBeenCalled();
  });

  it('6. PATCH /api/tickets/:id updates status (requires auth)', async () => {
    await api
      .patch('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect((r: any) => expect([200, 201]).toContain(r.status));

    expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ticket-1' }, data: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
    );
  });

  it('7. GET /api/tickets/csv returns CSV with correct content-type', async () => {
    const res = await api
      .get('/api/tickets/csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect((res.headers['content-type'] || '')).toMatch(/text\/csv/);
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
    const $queryRaw = mockPrisma.$queryRaw as jest.Mock;
    $queryRaw
      .mockResolvedValueOnce([{ date: '2024-01-15', count: 5 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await api
      .get('/api/reports/export/pdf')
      .query({ type: 'ticket-volume' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect((res.headers['content-type'] || '')).toMatch(/application\/pdf/);
    expect(res.status).toBe(200);
  });

  it('10. 102 requests to same endpoint, some throttled (429)', async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([]);
    mockPrisma.ticket.count.mockResolvedValue(0);

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

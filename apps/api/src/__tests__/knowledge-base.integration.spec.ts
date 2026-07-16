import { mockPrisma, mockNotifications, createTestJwt, setup } from './setup';
import type { INestApplication } from '@nestjs/common';

describe('KbController (integration)', () => {
  let nestApp: INestApplication;
  let api: any;
  const token = createTestJwt();

  const mockArticle = {
    id: 'art-1',
    slug: 'how-to-reset',
    title: 'How to Reset Password',
    content: 'Go to settings and click reset.',
    published: true,
    categoryId: 'cat-1',
    createdById: 'user-1',
    viewCount: 0,
    helpful: 0,
    notHelpful: 0,
    category: { id: 'cat-1', name: 'Getting Started' },
    createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' },
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
    mockPrisma.article.findMany.mockResolvedValue([mockArticle]);
    mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
    mockPrisma.articleCategory.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Getting Started', slug: 'getting-started', _count: { articles: 1 } },
    ]);
    mockPrisma.article.create.mockResolvedValue({
      ...mockArticle,
      id: 'art-new',
      title: 'New Article',
      slug: 'new-article',
      category: { id: 'cat-1', name: 'Getting Started' },
    });
    mockPrisma.article.findUnique.mockResolvedValueOnce(null);
    mockPrisma.article.findUnique.mockResolvedValue(mockArticle);
  });

  it('1. GET /api/kb/articles returns 200 with list', async () => {
    const res = await api.get('/api/kb/articles').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it('2. POST /api/kb/admin/articles creates article with auth', async () => {
    const res = await api
      .post('/api/kb/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Brand New Article', content: 'Article body.', categoryId: 'cat-1' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Brand New Article');
    expect(mockPrisma.article.create).toHaveBeenCalled();
  });

  it('3. GET /api/kb/articles/:slug returns article', async () => {
    mockPrisma.article.update.mockResolvedValue(mockArticle);
    const res = await api.get('/api/kb/articles/how-to-reset').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('how-to-reset');
    expect(mockPrisma.article.findUnique).toHaveBeenCalled();
  });

  it('4. PATCH /api/kb/admin/articles/:id updates with auth', async () => {
    mockPrisma.article.update.mockResolvedValue({ ...mockArticle, title: 'Updated Title' });

    const res = await api
      .patch('/api/kb/admin/articles/art-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', content: 'Updated body.' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(mockPrisma.article.update).toHaveBeenCalled();
  });

  it('5. GET /api/kb/articles/search?q=foo returns filtered results', async () => {
    mockPrisma.article.findMany.mockResolvedValue([mockArticle]);

    const res = await api.get('/api/kb/articles/search?q=reset').expect(200);

    expect(res.body.success).toBe(true);
    expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ published: true }),
      }),
    );
  });

  it('6. POST /api/kb/admin/articles returns error with missing title', async () => {
    await api
      .post('/api/kb/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title provided - should be rejected.' })
      .expect((r: any) => expect([400, 401, 403]).toContain(r.status));
  });
});

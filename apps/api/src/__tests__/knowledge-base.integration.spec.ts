import { PrismaService } from '../prisma/prisma.service';
import { setup, createTestJwt } from './setup.integration';
import type { INestApplication } from '@nestjs/common';

describe('KbController (integration)', () => {
  let nestApp: INestApplication;
  let api: any;
  let prisma: PrismaService;
  const token = createTestJwt();

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
    await prisma.article.deleteMany();
  });

  const createArticle = (overrides?: any) => {
    return prisma.article.create({
      data: {
        title: 'How to Reset Password',
        slug: 'how-to-reset',
        content: 'Go to settings and click reset.',
        published: true,
        categoryId: 'cat-1',
        createdById: 'user-1',
        ...overrides,
      },
    });
  };

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

    const article = await prisma.article.findFirst({
      where: { title: 'Brand New Article' },
    });
    expect(article).not.toBeNull();
  });

  it('3. GET /api/kb/articles/:slug returns article', async () => {
    await createArticle({ slug: 'how-to-reset' });

    const res = await api.get('/api/kb/articles/how-to-reset').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('how-to-reset');
  });

  it('4. PATCH /api/kb/admin/articles/:id updates with auth', async () => {
    await createArticle({ id: 'art-1', title: 'Original Title' });

    const res = await api
      .patch('/api/kb/admin/articles/art-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', content: 'Updated body.' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');

    const article = await prisma.article.findUnique({ where: { id: 'art-1' } });
    expect(article?.title).toBe('Updated Title');
  });

  it('5. GET /api/kb/articles/search?q=foo returns filtered results', async () => {
    await createArticle({ title: 'How to Reset', content: 'Article content.' });

    const res = await api.get('/api/kb/articles/search?q=reset').expect(200);

    expect(res.body.success).toBe(true);
    const data = res.body.data as any[];
    expect(data.some((a) => a.title.toLowerCase().includes('reset'))).toBe(true);
  });

  it('6. POST /api/kb/admin/articles returns error with missing title', async () => {
    await api
      .post('/api/kb/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title provided - should be rejected.' })
      .expect((r) => expect([400, 401, 403]).toContain(r.status));
  });
});

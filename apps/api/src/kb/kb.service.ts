import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KbService {
  constructor(private prisma: PrismaService) {}

  async createCategory(data: { name: string; description?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return this.prisma.articleCategory.create({ data: { ...data, slug } });
  }

  async findAllCategories() {
    return this.prisma.articleCategory.findMany({
      include: { _count: { select: { articles: { where: { published: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async createArticle(data: {
    title: string;
    content: string;
    categoryId?: string;
    createdById: string;
  }) {
    let slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    return this.prisma.article.create({
      data: { ...data, slug },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async findAllArticles(categoryId?: string, q?: string, all?: boolean, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (!all) where.published = true;
    if (categoryId) where.categoryId = categoryId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findArticle(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');
    await this.prisma.article.update({ where: { slug }, data: { viewCount: { increment: 1 } } });
    return article;
  }

  async vote(slug: string, helpful: boolean) {
    const field = helpful ? 'helpful' : 'notHelpful';
    return this.prisma.article.update({
      where: { slug },
      data: { [field]: { increment: 1 } },
    });
  }

  async updateArticle(id: string, data: any) {
    return this.prisma.article.update({ where: { id }, data });
  }

  async deleteArticle(id: string) {
    await this.prisma.article.delete({ where: { id } });
  }

  async searchArticles(q: string) {
    return this.prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, slug: true },
      take: 5,
    });
  }
}

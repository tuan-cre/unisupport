import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateKnownErrorDto } from './dto/create-known-error.dto';
import { UpdateKnownErrorDto } from './dto/update-known-error.dto';

@Injectable()
export class KnownErrorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, q?: string, category?: string, severity?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.KnownErrorWhereInput = {};
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { workaround: { contains: q, mode: 'insensitive' } },
        { solution: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (severity) where.severity = severity;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.knownError.findMany({
        where,
        skip,
        take: limit,
        include: {
          problem: { select: { id: true, subject: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knownError.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ke = await this.prisma.knownError.findUnique({
      where: { id },
      include: {
        problem: { select: { id: true, subject: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!ke) throw new NotFoundException('Known error not found');
    return ke;
  }

  async create(dto: CreateKnownErrorDto, userId: string) {
    return this.prisma.knownError.create({
      data: { ...dto, createdById: userId },
      include: {
        problem: { select: { id: true, subject: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateKnownErrorDto) {
    await this.findOne(id);
    return this.prisma.knownError.update({
      where: { id },
      data: dto,
      include: {
        problem: { select: { id: true, subject: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.knownError.delete({ where: { id } });
    return { message: 'Known error deleted' };
  }
}

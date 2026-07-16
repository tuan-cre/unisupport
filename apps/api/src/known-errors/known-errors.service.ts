import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnownErrorDto } from './dto/create-known-error.dto';
import { UpdateKnownErrorDto } from './dto/update-known-error.dto';

@Injectable()
export class KnownErrorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.knownError.findMany({
      include: {
        problem: { select: { id: true, subject: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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

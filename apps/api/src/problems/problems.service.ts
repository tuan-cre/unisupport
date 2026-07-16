import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.problem.findMany({
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: { include: { ticket: { select: { id: true, subject: true, status: true } } } },
        knownErrors: { select: { id: true, subject: true } },
        _count: { select: { changes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: { include: { ticket: { select: { id: true, subject: true, status: true } } } },
        knownErrors: true,
        changes: { select: { id: true, subject: true, status: true } },
      },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  async create(dto: CreateProblemDto, userId: string) {
    const { ticketIds, ...data } = dto;
    return this.prisma.problem.create({
      data: {
        ...data,
        createdById: userId,
        ...(ticketIds?.length
          ? {
              tickets: { create: ticketIds.map((ticketId) => ({ ticketId })) },
            }
          : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: { include: { ticket: { select: { id: true, subject: true, status: true } } } },
      },
    });
  }

  async update(id: string, dto: UpdateProblemDto) {
    await this.findOne(id);
    const { ticketIds, ...data } = dto;
    if (ticketIds) {
      await this.prisma.problemTicket.deleteMany({ where: { problemId: id } });
      if (ticketIds.length > 0) {
        await this.prisma.problemTicket.createMany({
          data: ticketIds.map((ticketId) => ({ problemId: id, ticketId })),
        });
      }
    }
    return this.prisma.problem.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tickets: { include: { ticket: { select: { id: true, subject: true, status: true } } } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.problem.delete({ where: { id } });
    return { message: 'Problem deleted' };
  }
}

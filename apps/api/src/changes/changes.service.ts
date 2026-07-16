import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChangeDto } from './dto/create-change.dto';
import { UpdateChangeDto } from './dto/update-change.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';

@Injectable()
export class ChangesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.changeRequest.findMany({
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        problem: { select: { id: true, subject: true } },
        approvals: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const change = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        problem: { select: { id: true, subject: true } },
        approvals: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
    if (!change) throw new NotFoundException('Change request not found');
    return change;
  }

  async create(dto: CreateChangeDto, userId: string) {
    return this.prisma.changeRequest.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        riskLevel: dto.riskLevel,
        problemId: dto.problemId,
        assigneeId: dto.assigneeId,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        requesterId: userId,
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        problem: { select: { id: true, subject: true } },
      },
    });
  }

  async update(id: string, dto: UpdateChangeDto) {
    await this.findOne(id);
    return this.prisma.changeRequest.update({
      where: { id },
      data: {
        ...dto,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        problem: { select: { id: true, subject: true } },
        approvals: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.changeRequest.delete({ where: { id } });
    return { message: 'Change request deleted' };
  }

  // --- Approvals (nested under changes) ---
  async addApproval(changeId: string, dto: CreateApprovalDto) {
    await this.findOne(changeId);
    return this.prisma.approval.create({
      data: { ...dto, changeRequestId: changeId },
      include: { approver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async updateApproval(changeId: string, approvalId: string, dto: UpdateApprovalDto) {
    const approval = await this.prisma.approval.findFirst({
      where: { id: approvalId, changeRequestId: changeId },
    });
    if (!approval) throw new NotFoundException('Approval not found');
    return this.prisma.approval.update({
      where: { id: approvalId },
      data: { ...dto, decidedAt: dto.status && dto.status !== 'PENDING' ? new Date() : undefined },
      include: { approver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removeApproval(changeId: string, approvalId: string) {
    const approval = await this.prisma.approval.findFirst({
      where: { id: approvalId, changeRequestId: changeId },
    });
    if (!approval) throw new NotFoundException('Approval not found');
    await this.prisma.approval.delete({ where: { id: approvalId } });
    return { message: 'Approval deleted' };
  }
}

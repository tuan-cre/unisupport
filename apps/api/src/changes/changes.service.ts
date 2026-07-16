import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChangeDto } from './dto/create-change.dto';
import { UpdateChangeDto } from './dto/update-change.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';

@Injectable()
export class ChangesService {
  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['PENDING_APPROVAL'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'DRAFT'],
    APPROVED: ['IN_PROGRESS', 'ROLLED_BACK'],
    IN_PROGRESS: ['IMPLEMENTED', 'ROLLED_BACK'],
    IMPLEMENTED: ['REVIEWED', 'ROLLED_BACK'],
    REVIEWED: ['CLOSED', 'ROLLED_BACK'],
    REJECTED: ['DRAFT'],
    ROLLED_BACK: ['DRAFT'],
  };

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
    const status = dto.status ?? 'DRAFT';
    if (status !== 'DRAFT') {
      const allowed = ChangesService.VALID_TRANSITIONS['DRAFT'];
      if (!allowed?.includes(status)) {
        throw new BadRequestException(`Change must start as DRAFT, not ${status}`);
      }
    }
    return this.prisma.changeRequest.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        status,
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
    const existing = await this.findOne(id);
    if (dto.status && dto.status !== existing.status) {
      const allowed = ChangesService.VALID_TRANSITIONS[existing.status];
      if (!allowed?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${existing.status} to ${dto.status}`,
        );
      }
    }
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
    const change = await this.findOne(changeId);
    if (change.status !== 'DRAFT' && change.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Cannot modify approvals in current state');
    }
    return this.prisma.approval.create({
      data: { ...dto, changeRequestId: changeId },
      include: { approver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async updateApproval(changeId: string, approvalId: string, dto: UpdateApprovalDto, userId: string) {
    const approval = await this.prisma.approval.findFirst({
      where: { id: approvalId, changeRequestId: changeId },
      include: { changeRequest: { select: { status: true } } },
    });
    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.approverId !== userId) {
      throw new ForbiddenException('Only the designated approver can approve/reject');
    }

    const updated = await this.prisma.approval.update({
      where: { id: approvalId },
      data: { ...dto, decidedAt: dto.status && dto.status !== 'PENDING' ? new Date() : undefined },
      include: { approver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    // Auto-transition to APPROVED when all approvals are approved
    if (dto.status === 'APPROVED') {
      const allApprovals = await this.prisma.approval.findMany({
        where: { changeRequestId: changeId },
        select: { status: true },
      });
      if (allApprovals.length > 0 && allApprovals.every((a) => a.status === 'APPROVED')) {
        await this.prisma.changeRequest.update({
          where: { id: changeId },
          data: { status: 'APPROVED' },
        });
      }
    }

    return updated;
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

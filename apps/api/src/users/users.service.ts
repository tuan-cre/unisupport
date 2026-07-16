import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    return this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: await bcrypt.hash(dto.password, 12),
        roleId: dto.roleId || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          role: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { roleId?: string; departmentId?: string; status?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updateData: Record<string, string> = {};
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.status !== undefined) updateData.status = data.status;
    return this.prisma.user.update({
      where: { id },
      data: updateData as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }
}

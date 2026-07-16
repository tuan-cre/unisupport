import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: { permissions: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; permissionIds?: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Role already exists');
    return this.prisma.role.create({
      data: {
        name: data.name,
        permissions: data.permissionIds
          ? { connect: data.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: { name?: string; permissionIds?: string[] }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.permissionIds
          ? { permissions: { set: data.permissionIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { permissions: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    const userCount = await this.prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new ConflictException('Cannot delete role with assigned users');
    }
    await this.prisma.role.delete({ where: { id } });
  }
}

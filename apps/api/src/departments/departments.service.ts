import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, tickets: true } } },
    });
  }

  async create(name: string) {
    const existing = await this.prisma.department.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Department already exists');
    return this.prisma.department.create({ data: { name } });
  }

  async update(id: string, name: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.update({ where: { id }, data: { name } });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    const userCount = await this.prisma.user.count({ where: { departmentId: id } });
    if (userCount > 0) throw new ConflictException('Cannot delete department with users');
    await this.prisma.department.delete({ where: { id } });
  }
}

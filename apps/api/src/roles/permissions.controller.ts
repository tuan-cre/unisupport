import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions('user:manage')
  async findAll() {
    const data = await this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data };
  }
}

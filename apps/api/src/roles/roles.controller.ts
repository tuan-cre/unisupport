import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private roles: RolesService) {}

  @ApiOperation({ summary: 'List all roles with permissions' })
  @Get()
  async findAll() {
    const data = await this.roles.findAll();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a role' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: { name: string; permissionIds?: string[] }) {
    const data = await this.roles.create(dto);
    return { success: true, message: 'Role created', data };
  }

  @ApiOperation({ summary: 'Update a role' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: { name?: string; permissionIds?: string[] }) {
    const data = await this.roles.update(id, dto);
    return { success: true, message: 'Role updated', data };
  }

  @ApiOperation({ summary: 'Delete a role' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.roles.remove(id);
    return { success: true, message: 'Role deleted' };
  }
}

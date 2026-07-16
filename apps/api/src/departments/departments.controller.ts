import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private depts: DepartmentsService) {}

  @ApiOperation({ summary: 'List all departments' })
  @Get()
  async findAll() {
    const data = await this.depts.findAll();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a department' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body('name') name: string) {
    const data = await this.depts.create(name);
    return { success: true, message: 'Department created', data };
  }

  @ApiOperation({ summary: 'Update a department' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body('name') name: string) {
    const data = await this.depts.update(id, name);
    return { success: true, message: 'Department updated', data };
  }

  @ApiOperation({ summary: 'Delete a department' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.depts.remove(id);
    return { success: true, message: 'Department deleted' };
  }
}

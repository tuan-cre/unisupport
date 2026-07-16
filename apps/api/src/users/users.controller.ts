import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @ApiOperation({ summary: 'List users (admin)' })
  @Get()
  @RequirePermissions('user:manage')
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.users.findAll(Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @Get(':id')
  @RequirePermissions('user:manage')
  async findOne(@Param('id') id: string) {
    const data = await this.users.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update user (admin)' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: Record<string, unknown>, @Req() req: Request) {
    if (id === req.user!.id) {
      return { success: false, message: 'Cannot modify yourself' };
    }
    const data = await this.users.update(id, dto);
    return { success: true, message: 'User updated', data };
  }
}

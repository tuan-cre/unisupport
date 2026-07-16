import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ChangesService } from './changes.service';
import { CreateChangeDto } from './dto/create-change.dto';
import { UpdateChangeDto } from './dto/update-change.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Change Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('changes')
export class ChangesController {
  constructor(private changes: ChangesService) {}

  @ApiOperation({ summary: 'List all change requests' })
  @Get()
  async findAll() {
    const data = await this.changes.findAll();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get change request by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.changes.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a change request' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: CreateChangeDto, @Req() req: any) {
    const data = await this.changes.create(dto, req.user.id);
    return { success: true, message: 'Change request created', data };
  }

  @ApiOperation({ summary: 'Update a change request' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateChangeDto) {
    const data = await this.changes.update(id, dto);
    return { success: true, message: 'Change request updated', data };
  }

  @ApiOperation({ summary: 'Delete a change request' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.changes.remove(id);
    return { success: true, message: 'Change request deleted' };
  }

  // --- Nested approvals ---
  @ApiOperation({ summary: 'Add approval to a change request' })
  @Post(':id/approvals')
  @RequirePermissions('user:manage')
  async addApproval(@Param('id') id: string, @Body() dto: CreateApprovalDto) {
    const data = await this.changes.addApproval(id, dto);
    return { success: true, message: 'Approval added', data };
  }

  @ApiOperation({ summary: 'Update an approval (approve/reject)' })
  @Patch(':id/approvals/:approvalId')
  @RequirePermissions('user:manage')
  async updateApproval(
    @Param('id') id: string,
    @Param('approvalId') approvalId: string,
    @Body() dto: UpdateApprovalDto,
    @Req() req: Request,
  ) {
    const data = await this.changes.updateApproval(id, approvalId, dto, req as any);
    return { success: true, message: 'Approval updated', data };
  }

  @ApiOperation({ summary: 'Remove an approval' })
  @Delete(':id/approvals/:approvalId')
  @RequirePermissions('user:manage')
  async removeApproval(@Param('id') id: string, @Param('approvalId') approvalId: string) {
    await this.changes.removeApproval(id, approvalId);
    return { success: true, message: 'Approval removed' };
  }
}

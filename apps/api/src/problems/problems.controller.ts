import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Problems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private problems: ProblemsService) {}

  @ApiOperation({ summary: 'List all problems' })
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    const result = await this.problems.findAll(Number(page) || 1, Number(limit) || 20, q);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Get problem by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.problems.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a problem' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: CreateProblemDto, @Req() req: any) {
    const data = await this.problems.create(dto, req.user.id);
    return { success: true, message: 'Problem created', data };
  }

  @ApiOperation({ summary: 'Update a problem' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
    const data = await this.problems.update(id, dto);
    return { success: true, message: 'Problem updated', data };
  }

  @ApiOperation({ summary: 'Delete a problem' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.problems.remove(id);
    return { success: true, message: 'Problem deleted' };
  }
}

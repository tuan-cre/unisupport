import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnownErrorsService } from './known-errors.service';
import { CreateKnownErrorDto } from './dto/create-known-error.dto';
import { UpdateKnownErrorDto } from './dto/update-known-error.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Known Errors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('known-errors')
export class KnownErrorsController {
  constructor(private kes: KnownErrorsService) {}

  @ApiOperation({ summary: 'List all known errors' })
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
  ) {
    const result = await this.kes.findAll(Number(page) || 1, Number(limit) || 20, q, category, severity);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Get known error by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.kes.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a known error' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: CreateKnownErrorDto, @Req() req: any) {
    const data = await this.kes.create(dto, req.user.id);
    return { success: true, message: 'Known error created', data };
  }

  @ApiOperation({ summary: 'Update a known error' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateKnownErrorDto) {
    const data = await this.kes.update(id, dto);
    return { success: true, message: 'Known error updated', data };
  }

  @ApiOperation({ summary: 'Delete a known error' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.kes.remove(id);
    return { success: true, message: 'Known error deleted' };
  }
}

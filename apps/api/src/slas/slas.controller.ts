import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlasService } from './slas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { CreateSlaDto } from './dto/create-sla.dto';
import { UpdateSlaDto } from './dto/update-sla.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@ApiTags('SLA')
@ApiBearerAuth()
@Controller('slas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlasController {
  constructor(private slas: SlasService) {}

  @ApiOperation({ summary: 'List all SLA policies' })
  @Get()
  async findAll() {
    const data = await this.slas.findAll();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get SLA policy by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.slas.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create an SLA policy' })
  @Post()
  @RequirePermissions('user:manage')
  async create(@Body() dto: CreateSlaDto) {
    const data = await this.slas.create(dto);
    return { success: true, message: 'SLA created', data };
  }

  @ApiOperation({ summary: 'Update an SLA policy' })
  @Patch(':id')
  @RequirePermissions('user:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateSlaDto) {
    const data = await this.slas.update(id, dto);
    return { success: true, message: 'SLA updated', data };
  }

  @ApiOperation({ summary: 'Delete an SLA policy' })
  @Delete(':id')
  @RequirePermissions('user:manage')
  async remove(@Param('id') id: string) {
    await this.slas.remove(id);
    return { success: true, message: 'SLA deleted' };
  }

  @ApiOperation({ summary: 'List all SLA calendars' })
  @Get('calendars')
  async findAllCalendars() {
    const data = await this.slas.findAllCalendars();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create an SLA calendar' })
  @Post('calendars')
  @RequirePermissions('user:manage')
  async createCalendar(@Body() dto: CreateCalendarDto) {
    const data = await this.slas.createCalendar(dto);
    return { success: true, message: 'Calendar created', data };
  }

  @ApiOperation({ summary: 'Update an SLA calendar' })
  @Patch('calendars/:id')
  @RequirePermissions('user:manage')
  async updateCalendar(@Param('id') id: string, @Body() dto: UpdateCalendarDto) {
    const data = await this.slas.updateCalendar(id, dto);
    return { success: true, message: 'Calendar updated', data };
  }

  @ApiOperation({ summary: 'Delete an SLA calendar' })
  @Delete('calendars/:id')
  @RequirePermissions('user:manage')
  async removeCalendar(@Param('id') id: string) {
    await this.slas.removeCalendar(id);
    return { success: true, message: 'Calendar deleted' };
  }
}

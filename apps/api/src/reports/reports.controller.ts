import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('ticket-volume')
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'Ticket volume over time' })
  async ticketVolume(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const data = await this.reports.ticketVolume(startDate, endDate);
    return { success: true, data };
  }

  @Get('sla-compliance')
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'SLA compliance rates' })
  async slaCompliance(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const data = await this.reports.slaCompliance(startDate, endDate);
    return { success: true, data };
  }

  @Get('agent-performance')
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'Per-agent ticket performance' })
  async agentPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reports.agentPerformance(startDate, endDate);
    return { success: true, data };
  }

  @Get('csat')
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'CSAT / satisfaction survey data' })
  async csat(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const data = await this.reports.csat(startDate, endDate);
    return { success: true, data };
  }

  @Get('export')
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'Export report as CSV' })
  async exportCsv(
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!type) return res.status(400).json({ success: false, message: 'Report type is required' });
    const csv = await this.reports.exportCsv(type, startDate, endDate);
    if (!csv) {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  }
}

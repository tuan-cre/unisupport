import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @ApiOperation({ summary: 'Get role-aware dashboard statistics' })
  @Get('stats')
  async getStats(@Req() req: Request) {
    const roleName = req.user!.roleName;
    const data = await this.dashboard.getStats(req.user!.id, roleName);
    return { success: true, data };
  }
}

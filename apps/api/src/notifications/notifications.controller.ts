import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private ns: NotificationsService) {}

  @ApiOperation({ summary: 'List notifications for current user' })
  @Get()
  async findAll(@Req() req: Request) {
    const data = await this.ns.findByUser(req.user!.id);
    const unread = await this.ns.countUnread(req.user!.id);
    return { success: true, data, unread };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: Request) {
    await this.ns.markRead(id, req.user!.id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    await this.ns.markAllRead(req.user!.id);
    return { success: true };
  }
}

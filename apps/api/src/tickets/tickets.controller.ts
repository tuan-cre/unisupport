import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { FilesService } from '../files/files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListTicketsQueryDto } from './dto/list-tickets.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateRelationDto } from './dto/relation.dto';
import { CreateTimeEntryDto } from './dto/time-entry.dto';
import { Request } from 'express';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TicketsController {
  constructor(
    private tickets: TicketsService,
    private files: FilesService,
  ) {}

  @ApiOperation({ summary: 'Create a new ticket' })
  @Post('tickets')
  async create(@Body() dto: CreateTicketDto, @Req() req: Request) {
    const ticket = await this.tickets.create(dto, req.user!.id);
    return { success: true, message: 'Ticket created', data: ticket };
  }

  @ApiOperation({ summary: 'List tickets (with search, filter, pagination)' })
  @Get('tickets')
  async findAll(@Req() req: Request, @Query() query: ListTicketsQueryDto) {
    const roleName = req.user!.roleName ?? null;
    const result = await this.tickets.findAll(req.user!.id, roleName, query);
    return { success: true, message: 'Tickets retrieved', ...result };
  }

  @ApiOperation({ summary: 'Get ticket by ID' })
  @Get('tickets/:id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const roleName = req.user!.roleName ?? null;
    const ticket = await this.tickets.findOne(id, req.user!.id, roleName);
    return { success: true, message: 'Ticket retrieved', data: ticket };
  }

  @ApiOperation({ summary: 'Update ticket (status, priority, assignee, etc.)' })
  @Patch('tickets/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @Req() req: Request) {
    const roleName = req.user!.roleName ?? null;
    const ticket = await this.tickets.update(id, dto, req.user!.id, roleName);
    return { success: true, message: 'Ticket updated', data: ticket };
  }

  @ApiOperation({ summary: 'Add a comment to a ticket' })
  @Post('tickets/:id/comments')
  async addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @Req() req: Request) {
    const roleName = req.user!.roleName ?? null;
    const comment = await this.tickets.addComment(id, dto, req.user!.id, roleName);
    return { success: true, message: 'Comment added', data: comment };
  }

  @ApiOperation({ summary: 'Bulk update tickets (admin/agent only)' })
  @Post('tickets/bulk')
  @HttpCode(HttpStatus.OK)
  async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
    const roleName = req.user!.roleName ?? null;
    const result = await this.tickets.bulkUpdate(dto, req.user!.id, roleName);
    return { success: true, message: 'Bulk update applied', ...result };
  }

  @ApiOperation({ summary: 'Create a tag' })
  @Post('tags')
  async createTag(@Body() dto: CreateTagDto) {
    const data = await this.tickets.createTag(dto);
    return { success: true, message: 'Tag created', data };
  }

  @ApiOperation({ summary: 'List all tags' })
  @Get('tags')
  async findAllTags() {
    const data = await this.tickets.findAllTags();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Add a watcher to a ticket' })
  @Post('tickets/:id/watchers')
  async addWatcher(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Req() req: Request,
  ) {
    const roleName = req.user!.roleName ?? null;
    const isAdminOrAgent = roleName === 'admin' || roleName === 'agent';
    if (!isAdminOrAgent && req.user!.id !== userId) {
      return { success: false, message: 'Only agents can add other users as watchers' };
    }
    await this.tickets.addWatcher(id, userId);
    return { success: true, message: 'Watcher added' };
  }

  @ApiOperation({ summary: 'Remove a watcher from a ticket' })
  @Delete('tickets/:id/watchers/:userId')
  async removeWatcher(@Param('id') id: string, @Param('userId') userId: string) {
    await this.tickets.removeWatcher(id, userId);
    return { success: true, message: 'Watcher removed' };
  }

  @ApiOperation({ summary: 'Add a relation between tickets' })
  @Post('tickets/:id/relations')
  async addRelation(@Param('id') id: string, @Body() dto: CreateRelationDto) {
    const data = await this.tickets.addRelation(id, dto);
    return { success: true, message: 'Relation added', data };
  }

  @ApiOperation({ summary: 'Remove a ticket relation' })
  @Delete('tickets/relations/:relationId')
  async removeRelation(@Param('relationId') relationId: string) {
    await this.tickets.removeRelation(relationId);
    return { success: true, message: 'Relation removed' };
  }

  @ApiOperation({ summary: 'Log time entry on a ticket' })
  @Post('tickets/:id/time')
  async addTimeEntry(
    @Param('id') id: string,
    @Body() dto: CreateTimeEntryDto,
    @Req() req: Request,
  ) {
    const data = await this.tickets.addTimeEntry(id, dto, req.user!.id);
    return { success: true, message: 'Time entry added', data };
  }

  @ApiOperation({ summary: 'Upload and attach file to ticket' })
  @Post('tickets/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTicketAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const attachment = await this.files.upload(file, req.user!.id);
    await this.tickets.attachFile(id, attachment.id);
    return { success: true, message: 'File attached', data: attachment };
  }

  @ApiOperation({ summary: 'Remove attachment from ticket' })
  @Delete('tickets/:id/attachments/:attachmentId')
  async removeTicketAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: Request,
  ) {
    await this.files.remove(attachmentId, req.user!.id);
    return { success: true, message: 'File removed' };
  }

  @ApiOperation({ summary: 'Create a ticket template' })
  @Post('templates')
  async createTemplate(
    @Body()
    dto: {
      name: string;
      subject: string;
      description: string;
      priority?: string;
      departmentId?: string;
    },
  ) {
    const data = await this.tickets.createTemplate(dto);
    return { success: true, message: 'Template created', data };
  }

  @ApiOperation({ summary: 'List all ticket templates' })
  @Get('templates')
  async findAllTemplates() {
    const data = await this.tickets.findAllTemplates();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a ticket template' })
  @Patch('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() dto: any) {
    const data = await this.tickets.updateTemplate(id, dto);
    return { success: true, message: 'Template updated', data };
  }

  @ApiOperation({ summary: 'Delete a ticket template' })
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    await this.tickets.deleteTemplate(id);
    return { success: true, message: 'Template deleted' };
  }

  @ApiOperation({ summary: 'Rate a ticket (CSAT survey)' })
  @HttpCode(HttpStatus.OK)
  @Post('tickets/:id/rate')
  async rateTicket(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('rating') rating: number,
    @Body('feedback') feedback?: string,
  ) {
    const data = await this.tickets.rateTicket(id, req.user!.id, rating, feedback);
    return { success: true, message: 'Rating submitted', data };
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private chat: ChatService,
    private config: ConfigService,
  ) {}

  // --- Unauthenticated visitor endpoints ---
  @ApiOperation({ summary: 'Create a new chat conversation (visitor)' })
  @Post('conversations')
  async createConversation(
    @Body() body: { subject?: string; visitorName?: string; visitorEmail?: string },
  ) {
    const data = await this.chat.createConversation(body);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Send a message to a conversation (visitor)' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('conversations/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() body: { content: string; senderType?: string; senderName?: string },
  ) {
    const data = await this.chat.addMessage(id, {
      content: body.content,
      senderType: body.senderType ?? 'VISITOR',
      senderName: body.senderName,
    });
    return { success: true, data };
  }

  // --- Visitor conversation fetch (pseudo-authenticated by email) ---
  @ApiOperation({ summary: 'Get conversation messages (visitor, by email)' })
  @Get('conversations/:id/messages')
  async getVisitorMessages(@Param('id') id: string, @Query('email') email: string) {
    const data = await this.chat.getConversationByEmail(id, email);
    return { success: true, data };
  }

  // --- Authenticated agent endpoints ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('ticket:read')
  @ApiOperation({ summary: 'List all chat conversations' })
  @Get('conversations')
  async listConversations(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.chat.listConversations(status, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('ticket:read')
  @ApiOperation({ summary: 'Get conversation details' })
  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    const data = await this.chat.getConversation(id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('ticket:read')
  @ApiOperation({ summary: 'Send message as agent' })
  @Post('conversations/:id/agent-message')
  async agentMessage(@Param('id') id: string, @Req() req: any, @Body() body: { content: string }) {
    const data = await this.chat.addMessage(id, {
      content: body.content,
      senderType: 'AGENT',
      senderId: req.user.id,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
    });
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('ticket:read')
  @ApiOperation({ summary: 'Close a conversation' })
  @Patch('conversations/:id/close')
  async closeConversation(@Param('id') id: string) {
    const data = await this.chat.closeConversation(id);
    return { success: true, message: 'Conversation closed', data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @ApiOperation({ summary: 'Convert chat conversation to ticket' })
  @Post('conversations/:id/convert')
  async convertToTicket(
    @Param('id') id: string,
    @Body() body: { subject?: string; departmentId?: string },
  ) {
    const data = await this.chat.convertToTicket(id, body.subject, body.departmentId);
    return { success: true, message: 'Conversation converted to ticket', data };
  }

  // --- Inbound email ---
  @ApiOperation({ summary: 'Ingest inbound email (webhook)' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('inbound-email')
  async inboundEmail(
    @Headers('x-webhook-secret') secret: string,
    @Body()
    body: {
      from: string;
      subject: string;
      body: string;
      references?: string;
      inReplyTo?: string;
    },
  ) {
    if (secret !== this.config.get<string>('WEBHOOK_SECRET')) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    const result = await this.chat.processInboundEmail(body);
    return { success: true, data: result };
  }
}

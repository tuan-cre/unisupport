import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KbService } from './kb.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../tickets/guards/permissions.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Knowledge Base')
@Controller('kb')
export class KbController {
  constructor(private kb: KbService) {}

  @ApiOperation({ summary: 'List all article categories' })
  @Get('categories')
  async findAllCategories() {
    const data = await this.kb.findAllCategories();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'List articles (optionally filter by category or search)' })
  @Get('articles')
  async findAllArticles(
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.kb.findAllArticles(categoryId, q, undefined, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Search articles by keyword' })
  @Get('articles/search')
  async searchArticles(@Query('q') q?: string) {
    const data = q ? await this.kb.searchArticles(q) : [];
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get article by slug' })
  @Get('articles/:slug')
  async findArticle(@Param('slug') slug: string) {
    const data = await this.kb.findArticle(slug);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Vote on article helpfulness' })
  @Post('articles/:slug/vote')
  async vote(@Param('slug') slug: string, @Body('helpful') helpful: boolean) {
    await this.kb.vote(slug, helpful);
    return { success: true, message: 'Vote recorded' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @Post('admin/categories')
  async createCategory(@Body('name') name: string, @Body('description') description?: string) {
    const data = await this.kb.createCategory({ name, description });
    return { success: true, message: 'Category created', data };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all articles including drafts (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @Get('admin/articles')
  async findAllArticlesAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.kb.findAllArticles(undefined, undefined, true, Number(page) || 1, Number(limit) || 20);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create article (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @Post('admin/articles')
  async createArticle(
    @Body() body: { title: string; content: string; categoryId?: string },
    @Req() req: Request,
  ) {
    const data = await this.kb.createArticle({ ...body, createdById: req.user!.id });
    return { success: true, message: 'Article created', data };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @Patch('admin/articles/:id')
  async updateArticle(@Param('id') id: string, @Body() body: any) {
    const data = await this.kb.updateArticle(id, body);
    return { success: true, message: 'Article updated', data };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:manage')
  @Delete('admin/articles/:id')
  async deleteArticle(@Param('id') id: string) {
    await this.kb.deleteArticle(id);
    return { success: true, message: 'Article deleted' };
  }
}

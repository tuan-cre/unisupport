import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response, Request } from 'express';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private files: FilesService) {}

  @ApiOperation({ summary: 'Upload a file' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const data = await this.files.upload(file, req.user!.id);
    return { success: true, message: 'File uploaded', data };
  }

  @ApiOperation({ summary: 'Download a file by ID' })
  @Get(':id')
  async download(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    const { stream, attachment } = await this.files.download(id, req.user!.id);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    stream.pipe(res);
  }

  @ApiOperation({ summary: 'Delete a file' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.files.remove(id, req.user!.id);
    return { success: true, message: 'File deleted' };
  }
}

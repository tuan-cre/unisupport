import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > 20 * 1024 * 1024) throw new BadRequestException('File too large (max 20MB)');

    const BLOCKED_MIMES = new Set([
      'application/x-executable', 'application/x-sh', 'application/x-bat',
      'application/x-msdownload', 'text/html', 'image/svg+xml',
      'application/java-archive', 'application/x-php', 'application/x-python',
    ]);
    if (BLOCKED_MIMES.has(file.mimetype)) throw new BadRequestException('File type not allowed');

    const ext = path.extname(file.originalname);
    const objectName = `${crypto.randomUUID()}${ext}`;

    const url = await this.minio.upload(objectName, file.buffer, file.mimetype);

    return this.prisma.attachment.create({
      data: {
        originalName: file.originalname,
        objectName,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
    });
  }

  async download(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');
    await this.assertAccess(attachment, userId);

    const stream = await this.minio.getStream(attachment.objectName);

    return { stream, attachment };
  }

  async remove(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');
    await this.assertAccess(attachment, userId);

    await this.minio.delete(attachment.objectName);
    await this.prisma.attachment.delete({ where: { id } });
  }

  private async assertAccess(attachment: { id: string; uploadedById: string | null; ticketId: string | null }, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    const roleName = user?.role?.name;
    const isAdminOrAgent = roleName === 'admin' || roleName === 'agent';

    if (isAdminOrAgent) return;
    if (attachment.uploadedById === userId) return;

    if (attachment.ticketId) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: attachment.ticketId },
        select: { requesterId: true, assigneeId: true },
      });
      if (ticket && (ticket.requesterId === userId || ticket.assigneeId === userId)) return;
    }

    throw new ForbiddenException('Access denied to this file');
  }
}

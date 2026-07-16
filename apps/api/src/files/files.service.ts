import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async download(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');

    const stream = await this.minio.getStream(attachment.objectName);

    return { stream, attachment };
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');

    await this.minio.delete(attachment.objectName);
    await this.prisma.attachment.delete({ where: { id } });
  }
}

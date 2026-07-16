import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT')!,
      port: Number(this.config.get<number>('MINIO_PORT')),
      useSSL: false,
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.config.get<string>('MINIO_SECRET_KEY')!,
    });
    this.bucket = 'unisupport';
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async upload(objectName: string, buffer: Buffer, contentType: string) {
    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    const protocol = this.config.get<string>('MINIO_ENDPOINT') === 'localhost' ? 'http' : 'https';
    const port = this.config.get<number>('MINIO_PORT');
    return `${protocol}://${this.config.get<string>('MINIO_ENDPOINT')}:${port}/${this.bucket}/${objectName}`;
  }

  async delete(objectName: string) {
    await this.client.removeObject(this.bucket, objectName);
  }

  async getStream(objectName: string) {
    return this.client.getObject(this.bucket, objectName);
  }
}

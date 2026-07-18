import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3001),
        WEB_ORIGIN: Joi.string().default('http://localhost:5173'),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        MINIO_ENDPOINT: Joi.string().required(),
        MINIO_PORT: Joi.number().required(),
        MINIO_ACCESS_KEY: Joi.string().required(),
        MINIO_SECRET_KEY: Joi.string().required(),
        SMTP_HOST: Joi.string().default('localhost'),
        SMTP_PORT: Joi.number().default(1025),
        SMTP_FROM: Joi.string().default('unisupport@localhost'),
        WEBHOOK_SECRET: Joi.string().min(16).required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        SENTRY_DSN: Joi.string().uri().optional(),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
        IMAP_HOST: Joi.string().optional(),
        IMAP_PORT: Joi.number().optional(),
        IMAP_SECURE: Joi.boolean().optional(),
        IMAP_USER: Joi.string().optional(),
        IMAP_PASSWORD: Joi.string().optional(),
        IMAP_TLS_REJECT_UNAUTHORIZED: Joi.boolean().optional(),
        IMAP_MAILBOX: Joi.string().optional(),
        IMAP_POLL_INTERVAL_MS: Joi.number().optional(),
      }),
    }),
  ],
})
export class AppConfigModule {}

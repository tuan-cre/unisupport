import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './metrics/metrics.module';

const isPretty = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DepartmentsModule } from './departments/departments.module';
import { MinioModule } from './minio/minio.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FilesModule } from './files/files.module';
import { KbModule } from './kb/kb.module';
import { SlasModule } from './slas/slas.module';
import { HealthModule } from './health/health.module';
import { SentryModule } from './sentry/sentry.module';
import { ReportsModule } from './reports/reports.module';
import { ProblemsModule } from './problems/problems.module';
import { KnownErrorsModule } from './known-errors/known-errors.module';
import { ChangesModule } from './changes/changes.module';
import { AssetsModule } from './assets/assets.module';
import { ChatModule } from './chat/chat.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60000, limit: 30 }],
        storage: new ThrottlerStorageRedisService(config.getOrThrow<string>('REDIS_URL')),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: isPretty ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
        autoLogging: true,
      },
    }),
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    MetricsModule,
    AppConfigModule,
    PrismaModule,
    AuthModule,
    TicketsModule,
    EventsModule,
    NotificationsModule,
    UsersModule,
    RolesModule,
    DepartmentsModule,
    MinioModule,
    DashboardModule,
    FilesModule,
    KbModule,
    SlasModule,
    HealthModule,
    SentryModule,
    ReportsModule,
    ProblemsModule,
    KnownErrorsModule,
    ChangesModule,
    AssetsModule,
    ChatModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

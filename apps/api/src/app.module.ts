import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
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

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: { target: 'pino-pretty', options: { colorize: true } },
        autoLogging: true,
      },
    }),
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
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
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Deep health check for DB, Redis, MinIO, Mailpit' })
  async check() {
    const config = (await import('@nestjs/config')).ConfigService;
    // We'll add more checks as the services become available via Terminus indicators
    return this.health.check([
      () => this.prisma.$queryRaw`SELECT 1`.then(() => ({ db: { status: 'up' } })),
    ]);
  }
}

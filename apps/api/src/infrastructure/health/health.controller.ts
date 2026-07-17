import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { BUILD_INFO, getHealthBuildPayload } from '../../build-info';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    let database: 'connected' | 'disconnected' | 'unknown' = 'unknown';
    let status: 'ok' | 'degraded' = 'ok';

    if (process.env.DATABASE_URL) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        database = 'connected';
      } catch {
        database = 'disconnected';
        status = 'degraded';
      }
    }

    return {
      ...getHealthBuildPayload({
        status,
        database,
        apiStatus: status === 'ok' ? 'online' : 'degraded',
        serverTime: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      }),
      service: 'saki-operations-api',
      timestamp: new Date().toISOString(),
      // Explicit aliases matching enterprise contract
      name: BUILD_INFO.name,
      version: BUILD_INFO.version,
      build: BUILD_INFO.build,
      environment: BUILD_INFO.environment,
      builtAt: BUILD_INFO.builtAt,
      apiStatus: status === 'ok' ? 'online' : 'degraded',
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      syncEngine: `v${BUILD_INFO.syncEngine}`,
    };
  }
}

import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import { InjectRedis, Redis } from '../redis/redis.module';

interface CheckResult {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

interface HealthDetails {
  database: {
    status: 'up' | 'down' | 'unknown';
    error?: string;
  };
  memory: {
    status: 'up' | 'degraded';
    heapUsedMB?: number;
    heapTotalMB?: number;
    warning?: string;
  };
}

interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  timestamp: string;
  uptime: number;
  details: HealthDetails;
}

const PROBE_TIMEOUT_MS = 2_000;

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get()
  async checkHealth(@Res() res: Response) {
    const healthStatus: HealthStatus = {
      status: 'up',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      details: {
        database: { status: 'unknown' },
        memory: { status: 'up' },
      },
    };

    let isHealthy = true;

    // Check Database Connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.details.database.status = 'up';
    } catch (error) {
      isHealthy = false;
      healthStatus.status = 'down';
      healthStatus.details.database = {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Check Memory Usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    healthStatus.details.memory = {
      status: 'up',
      heapUsedMB,
      heapTotalMB,
    };

    // If heap size is unreasonably high (e.g. > 1GB), mark as degraded/unhealthy
    if (heapUsedMB > 1024) {
      isHealthy = false;
      healthStatus.status = 'degraded';
      healthStatus.details.memory.status = 'degraded';
      healthStatus.details.memory.warning = 'High memory usage detected';
    }

    if (isHealthy) {
      return res.status(HttpStatus.OK).json(healthStatus);
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(healthStatus);
    }
  }

  @Get('liveness')
  checkLiveness(@Res() res: Response) {
    // Basic liveness probe (checks if container/service is alive/running)
    return res
      .status(HttpStatus.OK)
      .json({ status: 'alive', uptime: process.uptime() });
  }

  @Get('readiness')
  async checkReadiness(@Res() res: Response) {
    // Readiness probe: traffic needs both Postgres and Redis (auth sessions).
    const [database, redis] = await Promise.all([
      this.probe('database', () => this.prisma.$queryRaw`SELECT 1`),
      this.probe('redis', () => this.redis.ping()),
    ]);

    const ready = database.status === 'up' && redis.status === 'up';

    return res
      .status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json({
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: { database, redis },
      });
  }

  private async probe(
    name: string,
    check: () => Promise<unknown>,
  ): Promise<CheckResult> {
    const startedAt = Date.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        check(),
        new Promise((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${name} probe timed out`)),
            PROBE_TIMEOUT_MS,
          );
        }),
      ]);
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

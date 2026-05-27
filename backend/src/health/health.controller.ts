import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

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

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

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
    // Readiness probe (checks if app can serve traffic - needs database)
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({ status: 'ready' });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

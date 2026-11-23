import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { HealthController } from './health.controller';
import type { PrismaService } from '../prisma/prisma.service';
import type { Redis } from '../redis/redis.module';

function makeResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function makeController(
  overrides: {
    queryRaw?: () => Promise<unknown>;
    ping?: () => Promise<unknown>;
  } = {},
) {
  const prisma = {
    $queryRaw: vi.fn(
      overrides.queryRaw ?? (() => Promise.resolve([{ '?column?': 1 }])),
    ),
  } as unknown as PrismaService;
  const redis = {
    ping: vi.fn(overrides.ping ?? (() => Promise.resolve('PONG'))),
  } as unknown as Redis;
  return new HealthController(prisma, redis);
}

describe('HealthController', () => {
  describe('GET /health', () => {
    it('reports up with memory details when the database responds', async () => {
      const res = makeResponse();

      await makeController().checkHealth(res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('up');
      expect(body.details.database.status).toBe('up');
      expect(body.details.memory.heapUsedMB).toBeGreaterThan(0);
    });

    it('reports down when the database check fails', async () => {
      const res = makeResponse();
      const controller = makeController({
        queryRaw: () => Promise.reject(new Error('connection refused')),
      });

      await controller.checkHealth(res);

      expect(res.status).toHaveBeenCalledWith(503);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('down');
      expect(body.details.database).toMatchObject({
        status: 'down',
        error: 'connection refused',
      });
    });
  });

  describe('GET /health/liveness', () => {
    it('always reports alive', () => {
      const res = makeResponse();

      makeController().checkLiveness(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].status).toBe('alive');
    });
  });

  describe('GET /health/readiness', () => {
    it('is ready when the database and redis both respond', async () => {
      const res = makeResponse();

      await makeController().checkReadiness(res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('ready');
      expect(body.checks).toMatchObject({
        database: { status: 'up' },
        redis: { status: 'up' },
      });
    });

    it('is not ready when the database fails', async () => {
      const res = makeResponse();
      const controller = makeController({
        queryRaw: () => Promise.reject(new Error('db offline')),
      });

      await controller.checkReadiness(res);

      expect(res.status).toHaveBeenCalledWith(503);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('not_ready');
      expect(body.checks.database).toMatchObject({
        status: 'down',
        error: 'db offline',
      });
      expect(body.checks.redis.status).toBe('up');
    });

    it('is not ready when redis fails', async () => {
      const res = makeResponse();
      const controller = makeController({
        ping: () => Promise.reject(new Error('redis offline')),
      });

      await controller.checkReadiness(res);

      expect(res.status).toHaveBeenCalledWith(503);
      const body = res.json.mock.calls[0][0];
      expect(body.status).toBe('not_ready');
      expect(body.checks.redis).toMatchObject({
        status: 'down',
        error: 'redis offline',
      });
      expect(body.checks.database.status).toBe('up');
    });

    it('bounds hung dependency probes', async () => {
      const res = makeResponse();
      const controller = makeController({
        ping: () => new Promise(() => undefined),
      });

      vi.useFakeTimers();
      const pending = controller.checkReadiness(res);
      await vi.advanceTimersByTimeAsync(2_500);
      await pending;
      vi.useRealTimers();

      expect(res.status).toHaveBeenCalledWith(503);
      const body = res.json.mock.calls[0][0];
      expect(body.checks.redis).toMatchObject({
        status: 'down',
        error: 'redis probe timed out',
      });
    });
  });
});

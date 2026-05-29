import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { GraphQLResolveInfo } from 'graphql';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('IncomingRequest');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const requestId = randomUUID();

    const ctxType = context.getType<GqlContextType>();

    if (ctxType === 'graphql') {
      // GraphQL Request Logging
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo<GraphQLResolveInfo>();
      const req = gqlCtx.getContext<{
        req?: {
          ip?: string;
          headers?: Record<string, string | string[] | undefined>;
          user?: { id: number };
        };
      }>().req;

      const parentType = info.parentType.name;
      const fieldName = info.fieldName;
      const operation = info.operation.operation;

      const forwardedFor = req?.headers?.['x-forwarded-for'];
      const clientIp =
        req?.ip ||
        (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
        'unknown';

      const userAgentHeader = req?.headers?.['user-agent'];
      const userAgent =
        (Array.isArray(userAgentHeader)
          ? userAgentHeader[0]
          : userAgentHeader) || 'unknown';

      const userId = req?.user?.id ? `User(${req.user.id})` : 'Guest';

      this.logger.log(
        `[${requestId}] 🚀 GraphQL ${operation.toUpperCase()} | ${parentType}.${fieldName} | Caller: ${userId} | IP: ${clientIp} | UA: ${userAgent}`,
      );

      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            this.logger.log(
              `[${requestId}] ✅ GraphQL ${parentType}.${fieldName} completed in ${duration}ms`,
            );
          },
          error: (err: unknown) => {
            const duration = Date.now() - startTime;
            const errMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(
              `[${requestId}] ❌ GraphQL ${parentType}.${fieldName} failed in ${duration}ms | Error: ${errMsg}`,
            );
          },
        }),
      );
    } else {
      // HTTP Rest Request Logging (e.g., health checks, uploads)
      const http = context.switchToHttp();
      const req = http.getRequest<Request>();
      const res = http.getResponse<Response>();

      if (!req) return next.handle();

      const method = req.method;
      const url = req.originalUrl || req.url;

      const clientIp = req.ip || req.get('x-forwarded-for') || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      // Avoid spamming health check logs at info level if undesired, or log them cleanly
      const isHealth = url.includes('/health');
      if (!isHealth) {
        this.logger.log(
          `[${requestId}] 🌐 HTTP ${method} ${url} | IP: ${clientIp} | UA: ${userAgent}`,
        );
      }

      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            if (!isHealth) {
              this.logger.log(
                `[${requestId}] ✅ HTTP ${method} ${url} returned ${statusCode} in ${duration}ms`,
              );
            }
          },
          error: (err: unknown) => {
            const duration = Date.now() - startTime;
            const errMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(
              `[${requestId}] ❌ HTTP ${method} ${url} failed in ${duration}ms | Error: ${errMsg}`,
            );
          },
        }),
      );
    }
  }
}

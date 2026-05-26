import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('IncomingRequest');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const requestId = randomUUID();

    const ctxType = context.getType();

    if (ctxType === 'graphql') {
      // GraphQL Request Logging
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      const req = gqlCtx.getContext().req;

      const parentType = info.parentType.name;
      const fieldName = info.fieldName;
      const operation = info.operation.operation;

      const clientIp =
        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';
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
          error: (err) => {
            const duration = Date.now() - startTime;
            this.logger.error(
              `[${requestId}] ❌ GraphQL ${parentType}.${fieldName} failed in ${duration}ms | Error: ${err.message}`,
            );
          },
        }),
      );
    } else {
      // HTTP Rest Request Logging (e.g., health checks, uploads)
      const http = context.switchToHttp();
      const req = http.getRequest();
      const res = http.getResponse();

      if (!req) return next.handle();

      const method = req.method;
      const url = req.originalUrl || req.url;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

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
          error: (err) => {
            const duration = Date.now() - startTime;
            this.logger.error(
              `[${requestId}] ❌ HTTP ${method} ${url} failed in ${duration}ms | Error: ${err.message}`,
            );
          },
        }),
      );
    }
  }
}

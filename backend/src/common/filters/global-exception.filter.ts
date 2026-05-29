import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface SentryPlaceholder {
  init?: (options: { dsn: string }) => void;
  captureException?: (exception: unknown) => void;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  private isSentryInitialized = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      void this.initSentry(dsn);
    } else {
      this.logger.log(
        'No SENTRY_DSN found in environment. Sentry is disabled.',
      );
    }
  }

  private async initSentry(dsn: string) {
    try {
      const packageName = '@sentry/node';
      const sentry = (await import(packageName)) as SentryPlaceholder;
      if (sentry.init) {
        sentry.init({ dsn });
      }
      this.isSentryInitialized = true;
      this.logger.log('Sentry successfully initialized with DSN.');
    } catch {
      this.logger.warn(
        'Sentry package (@sentry/node) not installed, falling back to local logging.',
      );
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    // Log the error locally
    this.logger.error(
      `Unhandled Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send to Sentry if initialized
    if (this.isSentryInitialized) {
      void (async () => {
        try {
          const packageName = '@sentry/node';
          const sentry = (await import(packageName)) as SentryPlaceholder;
          if (sentry.captureException) {
            sentry.captureException(exception);
          }
        } catch {
          // Safe fallback
        }
      })();
    }

    const ctxType = host.getType() as string;

    if (ctxType === 'graphql') {
      // In GraphQL, NestJS handles resolver errors, but we can return the error formatted
      return exception;
    } else {
      // Rest HTTP Response
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    }
  }
}

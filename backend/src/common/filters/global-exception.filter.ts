import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  private isSentryInitialized = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      try {
        // Dynamically import @sentry/node if available so it doesn't fail if package is missing
        // This is the absolute best way to build a robust placeholder!
        require('@sentry/node').init({ dsn });
        this.isSentryInitialized = true;
        this.logger.log('Sentry successfully initialized with DSN.');
      } catch (err) {
        this.logger.warn(
          'Sentry package (@sentry/node) not installed, falling back to local logging.',
        );
      }
    } else {
      this.logger.log(
        'No SENTRY_DSN found in environment. Sentry is disabled.',
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
      try {
        require('@sentry/node').captureException(exception);
      } catch (err) {
        // Safe fallback
      }
    }

    const ctxType = host.getType();

    if (ctxType === 'graphql') {
      // In GraphQL, NestJS handles resolver errors, but we can return the error formatted
      return exception;
    } else {
      // Rest HTTP Response
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    }
  }
}

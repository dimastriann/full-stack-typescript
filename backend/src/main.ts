import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for GraphQL playground
    }),
  );

  // ─── Raw body for webhook signature verification ─────────────────────────────
  // Must be registered BEFORE json body parser (helmet/cookieParser run first).
  // Only applies to /subscription/webhook/* routes so normal routes are unaffected.
  app.use(
    '/subscription/webhook',
    (
      req: Request & { rawBody?: Buffer },
      _res: Response,
      next: NextFunction,
    ) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        req.rawBody = Buffer.concat(chunks);
        next();
      });
    },
  );

  app.use(cookieParser());
  // Support comma-separated URLs in FRONTEND_URL and normalize trailing slashes
  const rawFrontendUrls = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'http://localhost:8080']; // Include dev and default production docker ports

  const allowedOrigins = [
    ...rawFrontendUrls,
    'http://localhost:3000', // Backend/GraphQL playground
  ].map((url) => url.replace(/\/$/, ''));

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip validation for safe methods
    const reqMethod = req.method;
    if (['GET', 'HEAD', 'OPTIONS'].includes(reqMethod)) {
      next();
      return;
    }

    const rawOrigin = req.get('origin') || req.get('referer');

    // Allow requests with no origin (same-origin requests, server-to-server)
    if (!rawOrigin) {
      next();
      return;
    }

    const origin = rawOrigin.replace(/\/$/, '');

    // Validate origin against allowlist
    const isAllowed = allowedOrigins.some(
      (allowed) => origin === allowed || origin.startsWith(allowed + '/'),
    );

    if (!isAllowed) {
      res.status(403).json({ message: 'Forbidden: Invalid origin' });
      return;
    }

    next();
  });

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  // Enable the global validation pipe
  // - whitelist: strip properties not decorated with class-validator decorators
  // - forbidNonWhitelisted: throw 400 if unknown properties are sent
  // - transform: auto-coerce plain objects to DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

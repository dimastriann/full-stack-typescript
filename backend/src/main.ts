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

  app.use(cookieParser());

  // Origin validation middleware (replaces deprecated csurf)
  // Since we use httpOnly cookies with sameSite: 'lax', CSRF is largely mitigated.
  // This middleware adds an extra layer by validating Origin/Referer on mutations.
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000', // Backend/GraphQL playground
  ];

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip validation for safe methods
    const reqMethod = req.method;
    if (['GET', 'HEAD', 'OPTIONS'].includes(reqMethod)) {
      next();
      return;
    }

    const origin = req.get('origin') || req.get('referer');

    // Allow requests with no origin (same-origin requests, server-to-server)
    if (!origin) {
      next();
      return;
    }

    // Validate origin against allowlist
    const isAllowed = allowedOrigins.some((allowed) =>
      origin.startsWith(allowed),
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
  app.useGlobalPipes(new ValidationPipe());
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

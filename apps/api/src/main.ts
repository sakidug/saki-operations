import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { BUILD_INFO } from './build-info';
import { resolveJwtSecret } from './config/jwt-secret';
import { SYNC_MAX_FILE_BYTES } from './modules/sync/sync.constants';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // JWT — fail closed before the HTTP server binds.
  try {
    resolveJwtSecret({
      nodeEnv: process.env.NODE_ENV,
      secret: process.env.JWT_SECRET,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exit(1);
  }

  // H-02 — cap JSON body (base64 sync uploads need headroom; still bounded).
  const jsonLimitBytes = Math.ceil(SYNC_MAX_FILE_BYTES * 1.4) + 256 * 1024;

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');
  const port = config.get<number>('app.port', 3000);
  const corsOrigin = config.get<string>('app.corsOrigin', 'http://localhost:5173');
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');

  app.setGlobalPrefix(apiPrefix);
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.use(json({ limit: jsonLimitBytes }));
  app.use(urlencoded({ extended: true, limit: jsonLimitBytes }));
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(port);
  logger.log(
    `API listening on :${port} (${nodeEnv}) prefix=/${apiPrefix} version=v${BUILD_INFO.version} build=${BUILD_INFO.build}`,
  );
}

void bootstrap();

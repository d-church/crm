import '@/config/load-env';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from '@/app.module';
import { API_PREFIX } from '@/config/openapi';
import { useClientApp } from '@/bootstrap/client-app';
import { useSwagger } from '@/bootstrap/swagger';
import { ExceptionsFilter } from '@/common/filters/exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ExceptionsFilter());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.setGlobalPrefix(API_PREFIX);

  useSwagger(app);

  // Serves the client build when one exists; in dev that is Vite's job.
  useClientApp(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

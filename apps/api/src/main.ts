import '@/config/load-env';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from '@/app.module';
import { useSwagger } from '@/bootstrap/swagger';
import { ExceptionsFilter } from '@/common/filters/exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  useSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

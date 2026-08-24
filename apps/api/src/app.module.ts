import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';

import { InfraModule } from '@/infra/infra.module';

import { AppService } from './app.service';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    InfraModule,
    ApiModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}

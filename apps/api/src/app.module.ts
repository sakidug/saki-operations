import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './infrastructure/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModulesModule } from './modules/modules/modules.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    ModulesModule,
    SyncModule,
  ],
})
export class AppModule {}

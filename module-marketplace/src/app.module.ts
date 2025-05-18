import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './database/database.config';
import { ModulesModule } from './modules/modules/modules.module';
import { ModuleVersionsModule } from './modules/module-versions/module-versions.module';
import { ModuleDependenciesModule } from './modules/module-dependencies/module-dependencies.module';
import { ModuleInstallationsModule } from './modules/module-installations/module-installations.module';
import { CompatibilityCheckModule } from './modules/compatibility-check/compatibility-check.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import configs from './config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    
    // Event Emitter
    EventEmitterModule.forRoot(),
    
    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('app.throttle.ttl'),
        limit: config.get<number>('app.throttle.limit'),
      }),
    }),
    
    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('redis.host'),
        port: config.get<number>('redis.port'),
        password: config.get<string>('redis.password'),
        ttl: config.get<number>('redis.ttl'),
        db: config.get<number>('redis.db'),
        prefix: config.get<string>('redis.keyPrefix'),
      }),
    }),
    
    // Feature Modules
    ModulesModule,
    ModuleVersionsModule,
    ModuleDependenciesModule,
    ModuleInstallationsModule,
    CompatibilityCheckModule,
    FeatureFlagsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

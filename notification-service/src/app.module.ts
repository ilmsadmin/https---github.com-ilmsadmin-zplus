import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-store';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './database/database.config';
import { HealthModule } from './health/health.module';
import { TenantsModule } from './tenants/tenants.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';
import { EmailModule } from './channels/email/email.module';
import { PushModule } from './channels/push/push.module';
import { SmsModule } from './channels/sms/sms.module';
import { InAppModule } from './channels/in-app/in-app.module';
import { PreferencesModule } from './preferences/preferences.module';
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
    
    // Scheduled Tasks
    ScheduleModule.forRoot(),
    
    // Feature Modules
    TenantsModule,
    NotificationsModule,
    TemplatesModule,
    EmailModule,
    PushModule,
    SmsModule,
    InAppModule,
    PreferencesModule,
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

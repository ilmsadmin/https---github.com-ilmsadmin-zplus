import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import configuration, { validationSchema } from './config/configuration';
import { DatabaseModule } from './config/database.module';
import { RedisModule } from './config/redis.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      cache: true,
    }),
    
    // Core modules
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    LoggerModule,
    
    // Feature modules
    AuthModule,
    MfaModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

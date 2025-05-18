import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';
import { PlanFeaturesModule } from './modules/plan-features/plan-features.module';
import { UsageModule } from './modules/usage/usage.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PaymentGatewaysModule } from './modules/payment-gateways/payment-gateways.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WebhookHandlerModule } from './modules/webhook-handler/webhook-handler.module';
import { HealthModule } from './health/health.module';
import { getTypeOrmConfig } from './database/database.config';
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
    
    // Scheduler
    ScheduleModule.forRoot(),
    
    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('app.throttle.ttl', 60),
        limit: config.get<number>('app.throttle.limit', 100),
      }),
    }),
      // Feature Modules
    SubscriptionsModule,
    InvoicesModule,
    PaymentsModule,
    PlansModule,
    PlanFeaturesModule,
    UsageModule,
    ReportsModule,
    PaymentGatewaysModule,
    SchedulerModule,
    WebhookHandlerModule,
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

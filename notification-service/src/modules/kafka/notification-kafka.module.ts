/**
 * Kafka integration for the notification-service
 */
import { Module } from '@nestjs/common';
import { KafkaModule, NestKafkaService } from '@multi-tenant/event-bus';
import { NotificationKafkaService } from './notification-kafka.service';
import { TenantEventsConsumer } from './consumers/tenant-events.consumer';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { BillingEventsConsumer } from './consumers/billing-events.consumer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    KafkaModule.register({
      serviceName: 'notification-service',
      kafkaOptions: {
        clientId: 'notification-service',
        brokers: ['kafka:9092'],
        retry: {
          initialRetryTime: 300,
          retries: 5
        },
        circuitBreaker: {
          failureThreshold: 3,
          resetTimeout: 30000
        }
      },
      eventStore: {
        enabled: true,
        topic: 'notification.events'
      }
    })
  ],
  providers: [
    NotificationKafkaService,
    TenantEventsConsumer,
    UserEventsConsumer,
    BillingEventsConsumer
  ],
  exports: [NotificationKafkaService]
})
export class NotificationKafkaModule {}

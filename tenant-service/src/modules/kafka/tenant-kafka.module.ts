/**
 * Kafka integration for the tenant-service
 */
import { Module } from '@nestjs/common';
import { KafkaModule, NestKafkaService } from '@multi-tenant/event-bus';
import { TenantKafkaService } from './tenant-kafka.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    KafkaModule.register({
      serviceName: 'tenant-service',
      kafkaOptions: {
        clientId: 'tenant-service',
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
        topic: 'tenant.events'
      }
    })
  ],
  providers: [TenantKafkaService],
  exports: [TenantKafkaService]
})
export class TenantKafkaModule {}

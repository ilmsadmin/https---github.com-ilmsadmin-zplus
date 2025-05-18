import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private kafka: Kafka;

  constructor(private configService: ConfigService) {
    super();
    
    const kafkaEnabled = this.configService.get<boolean>('event.kafka.enabled');
    
    if (kafkaEnabled) {
      this.kafka = new Kafka({
        clientId: this.configService.get<string>('event.kafka.clientId'),
        brokers: this.configService.get<string[]>('event.kafka.brokers'),
        ssl: this.configService.get<boolean>('event.kafka.ssl'),
        ...(this.configService.get<string>('event.kafka.sasl.username') && {
          sasl: {
            mechanism: this.configService.get<string>('event.kafka.sasl.mechanism'),
            username: this.configService.get<string>('event.kafka.sasl.username'),
            password: this.configService.get<string>('event.kafka.sasl.password'),
          },
        }),
      });
    }
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    if (!this.kafka) {
      return this.getStatus(key, true, { message: 'Kafka not enabled' });
    }
    
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();
      
      return this.getStatus(key, true, { topics: topics.length });
    } catch (error) {
      throw new HealthCheckError(
        'Kafka health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}

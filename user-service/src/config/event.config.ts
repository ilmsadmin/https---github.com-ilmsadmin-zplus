import { registerAs } from '@nestjs/config';

export default registerAs('event', () => ({
  // Kafka configuration
  kafka: {
    enabled: process.env.KAFKA_ENABLED === 'true',
    clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'user-service-group',
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || '',
    },
  },
  
  // RabbitMQ configuration
  rabbitmq: {
    enabled: process.env.RABBITMQ_ENABLED === 'true',
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'user-service-queue',
    queueOptions: {
      durable: true,
    },
  },
}));

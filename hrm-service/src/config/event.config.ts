import { registerAs } from '@nestjs/config';

export default registerAs('event', () => ({
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'hrm-service',
    groupId: process.env.KAFKA_GROUP_ID || 'hrm-service-group',
    consumerSessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT, 10) || 30000,
  },
}));

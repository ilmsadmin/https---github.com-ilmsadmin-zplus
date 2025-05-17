import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  serviceName: 'tenant-service',
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    title: 'Tenant Service API',
    description: 'The tenant management API',
    version: '1.0',
    path: process.env.SWAGGER_PATH || 'docs',
  },
}));

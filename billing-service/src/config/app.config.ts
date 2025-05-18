import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  apiPrefix: process.env.API_PREFIX || 'api',
}));

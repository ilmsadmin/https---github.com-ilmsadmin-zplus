import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'user-service-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  adminApiSecret: process.env.ADMIN_API_SECRET || 'admin-secret-key',
}));

import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

// Setup the test environment
jest.mock('@nestjs/config', () => {
  const originalModule = jest.requireActual('@nestjs/config');

  return {
    ...originalModule,
    ConfigService: jest.fn().mockImplementation(() => ({
      get: jest.fn((key: string) => {
        // Mock configuration values for testing
        const config = {
          'jwt.accessSecret': 'test_access_secret',
          'jwt.accessExpiration': '15m',
          'jwt.refreshSecret': 'test_refresh_secret',
          'jwt.refreshExpiration': '7d',
          'database.system.host': 'localhost',
          'database.system.port': 5432,
          'database.system.username': 'postgres',
          'database.system.password': 'postgres',
          'database.system.database': 'test_db',
          'redis.host': 'localhost',
          'redis.port': 6379,
          'redis.password': '',
          'app.url': 'http://localhost:3000',
          'app.loginSuccessRedirect': 'http://localhost:3001/dashboard',
          'app.loginFailureRedirect': 'http://localhost:3001/login',
        };
        
        return config[key];
      }),
    })),
  };
});

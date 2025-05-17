import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    return {
      service: 'user-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
    };
  }

  async checkDatabase() {
    try {
      const result = await this.dataSource.query('SELECT 1');
      return {
        database: 'healthy',
        result: result.length > 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

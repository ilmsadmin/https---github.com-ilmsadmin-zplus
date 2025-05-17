import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Check the health of the service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}

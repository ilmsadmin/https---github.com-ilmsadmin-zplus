import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get service status',
    description: 'Returns basic information about the notification service including version, uptime, and environment'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service status information',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'notification-service' },
        version: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'online' },
        environment: { type: 'string', example: 'production' },
        uptime: { type: 'string', example: '2d 3h 45m' },
        timestamp: { type: 'string', format: 'date-time', example: '2025-05-18T01:45:21.352Z' }
      }
    }
  })
  getStatus() {
    return this.appService.getStatus();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('billing')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Returns service status' })
  getStatus(): { status: string; message: string; timestamp: Date } {
    return this.appService.getStatus();
  }
}

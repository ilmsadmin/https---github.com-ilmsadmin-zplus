import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipAuth } from './common/decorators/skip-auth.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipAuth()
  @ApiOperation({ summary: 'Get service information' })
  getInfo() {
    return this.appService.getInfo();
  }
}

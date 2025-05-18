import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private readonly tenantsService: TenantsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Return the tenant.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    this.logger.log(`Retrieving tenant ${id}`);
    return this.tenantsService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a tenant by code' })
  @ApiParam({ name: 'code', description: 'Tenant code' })
  @ApiResponse({ status: 200, description: 'Return the tenant.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async findByCode(@Param('code') code: string): Promise<Tenant> {
    this.logger.log(`Retrieving tenant with code ${code}`);
    return this.tenantsService.findByCode(code);
  }

  @Get(':id/notification-settings')
  @ApiOperation({ summary: 'Get notification settings for a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Return the notification settings.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async getNotificationSettings(@Param('id') id: string): Promise<any> {
    this.logger.log(`Retrieving notification settings for tenant ${id}`);
    return this.tenantsService.getNotificationSettings(id);
  }
}

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpCode, 
  HttpStatus, 
  Query, 
  Put 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiQuery 
} from '@nestjs/swagger';
import { TenantModulesService } from './tenant-modules.service';
import { CreateTenantModuleDto } from './dto/create-tenant-module.dto';
import { UpdateTenantModuleDto } from './dto/update-tenant-module.dto';
import { TenantModule } from './entities/tenant-module.entity';

@ApiTags('tenant-modules')
@Controller('tenant-modules')
export class TenantModulesController {
  constructor(private readonly tenantModulesService: TenantModulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant module mapping' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The tenant module has been successfully created.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Tenant is already associated with this module.' 
  })
  @ApiBody({ type: CreateTenantModuleDto })
  async create(@Body() createTenantModuleDto: CreateTenantModuleDto): Promise<TenantModule> {
    return this.tenantModulesService.create(createTenantModuleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all tenant module mappings or filter by tenant ID or module ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return all tenant modules.', 
    type: [TenantModule] 
  })
  @ApiQuery({ 
    name: 'tenantId', 
    required: false, 
    description: 'Filter by tenant ID' 
  })
  @ApiQuery({ 
    name: 'moduleId', 
    required: false, 
    description: 'Filter by module ID' 
  })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('moduleId') moduleId?: string
  ): Promise<TenantModule[]> {
    if (tenantId) {
      return this.tenantModulesService.findByTenantId(tenantId);
    }
    if (moduleId) {
      return this.tenantModulesService.findByModuleId(moduleId);
    }
    return this.tenantModulesService.findAll();
  }

  @Get(':tenantId/:moduleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific tenant module mapping' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Return the tenant module.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<TenantModule> {
    return this.tenantModulesService.findOne(tenantId, moduleId);
  }

  @Patch(':tenantId/:moduleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a tenant module mapping' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The tenant module has been successfully updated.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  @ApiBody({ type: UpdateTenantModuleDto })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() updateTenantModuleDto: UpdateTenantModuleDto,
  ): Promise<TenantModule> {
    return this.tenantModulesService.update(tenantId, moduleId, updateTenantModuleDto);
  }

  @Delete(':tenantId/:moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a tenant module mapping' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'The tenant module has been successfully removed.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<void> {
    return this.tenantModulesService.remove(tenantId, moduleId);
  }

  @Put(':tenantId/:moduleId/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a module for a tenant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module has been successfully enabled.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  async enableModule(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<TenantModule> {
    return this.tenantModulesService.enableModule(tenantId, moduleId);
  }

  @Put(':tenantId/:moduleId/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a module for a tenant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module has been successfully disabled.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  async disableModule(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<TenantModule> {
    return this.tenantModulesService.disableModule(tenantId, moduleId);
  }

  @Patch(':tenantId/:moduleId/config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update module configuration for a tenant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module configuration has been successfully updated.', 
    type: TenantModule 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant module mapping not found.' 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiParam({ name: 'moduleId', description: 'The module ID' })
  async updateConfig(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() config: Record<string, any>,
  ): Promise<TenantModule> {
    return this.tenantModulesService.updateModuleConfig(tenantId, moduleId, config);
  }

  @Post(':tenantId/bulk-enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable multiple modules for a tenant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The modules have been successfully enabled.', 
    type: [TenantModule] 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        moduleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of module IDs to enable'
        }
      }
    }
  })
  async bulkEnableModules(
    @Param('tenantId') tenantId: string,
    @Body('moduleIds') moduleIds: string[],
  ): Promise<TenantModule[]> {
    return this.tenantModulesService.bulkEnableModules(tenantId, moduleIds);
  }

  @Post(':tenantId/bulk-disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable multiple modules for a tenant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The modules have been successfully disabled.', 
    type: [TenantModule] 
  })
  @ApiParam({ name: 'tenantId', description: 'The tenant ID' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        moduleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of module IDs to disable'
        }
      }
    }
  })
  async bulkDisableModules(
    @Param('tenantId') tenantId: string,
    @Body('moduleIds') moduleIds: string[],
  ): Promise<TenantModule[]> {
    return this.tenantModulesService.bulkDisableModules(tenantId, moduleIds);
  }
}

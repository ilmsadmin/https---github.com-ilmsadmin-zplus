import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { TenantFeatureFlagDto } from './dto/tenant-feature-flag.dto';
import { ModuleFeatureFlag } from './entities/module-feature-flag.entity';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';
import { TenantContext } from '../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  private readonly logger = new Logger(FeatureFlagsController.name);

  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'The feature flag has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Feature flag with the same name already exists.' })
  async create(@Body() createDto: CreateFeatureFlagDto): Promise<ModuleFeatureFlag> {
    this.logger.log(`Creating feature flag: ${JSON.stringify(createDto)}`);
    return this.featureFlagsService.create(createDto);
  }

  @Get()
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Return all feature flags.' })
  async findAll(): Promise<ModuleFeatureFlag[]> {
    return this.featureFlagsService.findAll();
  }

  @Get('module/:moduleId')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Get all feature flags for a specific module' })
  @ApiParam({ name: 'moduleId', description: 'The ID of the module' })
  @ApiResponse({ status: 200, description: 'Return feature flags for the specified module.' })
  async findByModuleId(@Param('moduleId') moduleId: string): Promise<ModuleFeatureFlag[]> {
    return this.featureFlagsService.findByModuleId(moduleId);
  }

  @Get('tenant')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Get all feature flags for the current tenant' })
  @ApiResponse({ status: 200, description: 'Return all feature flags for the tenant.' })
  async getFeatureFlagsForTenant(
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.featureFlagsService.getFeatureFlagsForTenant(tenantContext.tenantId);
  }

  @Get(':id')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Get a specific feature flag by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the feature flag' })
  @ApiResponse({ status: 200, description: 'Return the feature flag.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  async findOne(@Param('id') id: string): Promise<ModuleFeatureFlag> {
    return this.featureFlagsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'id', description: 'The ID of the feature flag to update' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeatureFlagDto,
  ): Promise<ModuleFeatureFlag> {
    this.logger.log(`Updating feature flag ${id}: ${JSON.stringify(updateDto)}`);
    return this.featureFlagsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({ name: 'id', description: 'The ID of the feature flag to delete' })
  @ApiResponse({ status: 200, description: 'The feature flag has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting feature flag ${id}`);
    return this.featureFlagsService.remove(id);
  }

  @Post('tenant/override')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Set a tenant-specific feature flag override' })
  @ApiBody({ type: TenantFeatureFlagDto })
  @ApiResponse({ status: 200, description: 'The feature flag override has been set.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  @ApiResponse({ status: 409, description: 'Feature flag is not configurable or module not installed.' })
  async setTenantFeatureFlagOverride(
    @TenantContext() tenantContext: ITenantContext,
    @Body() dto: TenantFeatureFlagDto,
  ): Promise<void> {
    this.logger.log(`Setting feature flag override for tenant ${tenantContext.tenantId}: ${JSON.stringify(dto)}`);
    return this.featureFlagsService.setTenantFeatureFlagOverride(tenantContext.tenantId, dto);
  }

  @Delete('tenant/override/:featureFlagId')
  @UseGuards(TenantAuthGuard)
  @ApiOperation({ summary: 'Remove a tenant-specific feature flag override' })
  @ApiParam({ name: 'featureFlagId', description: 'The ID of the feature flag' })
  @ApiResponse({ status: 200, description: 'The feature flag override has been removed.' })
  @ApiResponse({ status: 404, description: 'Feature flag not found.' })
  async removeTenantFeatureFlagOverride(
    @TenantContext() tenantContext: ITenantContext,
    @Param('featureFlagId') featureFlagId: string,
  ): Promise<void> {
    this.logger.log(`Removing feature flag override for tenant ${tenantContext.tenantId}, flag ${featureFlagId}`);
    return this.featureFlagsService.removeTenantFeatureFlagOverride(tenantContext.tenantId, featureFlagId);
  }
}

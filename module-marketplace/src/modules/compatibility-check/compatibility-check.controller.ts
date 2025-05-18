import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CompatibilityCheckService, CompatibilityResult, UpgradePathItem } from './compatibility-check.service';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';
import { TenantContext } from '../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('compatibility-check')
@Controller('compatibility-check')
@UseGuards(TenantAuthGuard)
export class CompatibilityCheckController {
  private readonly logger = new Logger(CompatibilityCheckController.name);

  constructor(private readonly compatibilityService: CompatibilityCheckService) {}

  @Get('version/:versionId')
  @ApiOperation({ summary: 'Check if a module version is compatible with the tenant environment' })
  @ApiParam({ name: 'versionId', description: 'The module version ID to check compatibility for' })
  @ApiResponse({ status: 200, description: 'Compatibility check result' })
  async checkVersionCompatibility(
    @Param('versionId') versionId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<CompatibilityResult> {
    this.logger.log(`Checking compatibility for version ${versionId} for tenant ${tenantContext.tenantId}`);
    return this.compatibilityService.checkVersionCompatibility(versionId, tenantContext.tenantId);
  }

  @Get('upgrade-path/:moduleId')
  @ApiOperation({ summary: 'Calculate upgrade path for a module' })
  @ApiParam({ name: 'moduleId', description: 'The module ID to calculate upgrade path for' })
  @ApiQuery({ name: 'targetVersionId', description: 'The target version ID to upgrade to' })
  @ApiResponse({ status: 200, description: 'Upgrade path calculation result' })
  async calculateUpgradePath(
    @Param('moduleId') moduleId: string,
    @Query('targetVersionId') targetVersionId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UpgradePathItem[]> {
    this.logger.log(`Calculating upgrade path for module ${moduleId} to version ${targetVersionId} for tenant ${tenantContext.tenantId}`);
    return this.compatibilityService.calculateUpgradePath(moduleId, targetVersionId, tenantContext.tenantId);
  }

  @Get('module-set')
  @ApiOperation({ summary: 'Check compatibility of a set of module versions' })
  @ApiQuery({ 
    name: 'versionIds', 
    description: 'Comma-separated list of module version IDs to check compatibility for',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Module set compatibility check result' })
  async checkModuleSetCompatibility(
    @Query('versionIds') versionIdsString: string,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    const versionIds = versionIdsString.split(',');
    this.logger.log(`Checking compatibility for module set [${versionIds.join(', ')}] for tenant ${tenantContext.tenantId}`);
    return this.compatibilityService.checkModuleSetCompatibility(versionIds, tenantContext.tenantId);
  }
}

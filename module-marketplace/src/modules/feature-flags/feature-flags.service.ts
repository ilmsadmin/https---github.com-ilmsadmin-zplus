import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleFeatureFlag } from './entities/module-feature-flag.entity';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { TenantFeatureFlagDto } from './dto/tenant-feature-flag.dto';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleInstallation } from '../module-installations/entities/module-installation.entity';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  
  // In-memory cache for tenant feature flag overrides
  // In a production environment, this would be in Redis or another distributed cache
  private tenantFeatureFlagOverrides: Map<string, Map<string, { 
    isEnabled: boolean; 
    configuration: Record<string, any> 
  }>> = new Map();

  constructor(
    @InjectRepository(ModuleFeatureFlag)
    private readonly featureFlagRepository: Repository<ModuleFeatureFlag>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(ModuleInstallation)
    private readonly installationRepository: Repository<ModuleInstallation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createDto: CreateFeatureFlagDto): Promise<ModuleFeatureFlag> {
    this.logger.log(`Creating feature flag for module ${createDto.moduleId}: ${createDto.name}`);
    
    // Check if module exists
    const module = await this.moduleRepository.findOne({ 
      where: { id: createDto.moduleId } 
    });
    
    if (!module) {
      throw new NotFoundException(`Module with ID ${createDto.moduleId} not found`);
    }
    
    // Check if feature flag with this name already exists for the module
    const existingFlag = await this.featureFlagRepository.findOne({ 
      where: { 
        moduleId: createDto.moduleId,
        name: createDto.name,
      } 
    });
    
    if (existingFlag) {
      throw new ConflictException(`Feature flag with name ${createDto.name} already exists for this module`);
    }
    
    const featureFlag = this.featureFlagRepository.create(createDto);
    const result = await this.featureFlagRepository.save(featureFlag);
    
    // Emit event for feature flag creation
    this.eventEmitter.emit('module.featureFlag.created', result);
    
    return result;
  }

  async findAll(): Promise<ModuleFeatureFlag[]> {
    return this.featureFlagRepository.find({
      relations: ['module'],
    });
  }

  async findByModuleId(moduleId: string): Promise<ModuleFeatureFlag[]> {
    return this.featureFlagRepository.find({
      where: { moduleId },
      relations: ['module'],
    });
  }

  async findOne(id: string): Promise<ModuleFeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findOne({
      where: { id },
      relations: ['module'],
    });
    
    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    
    return featureFlag;
  }

  async update(id: string, updateDto: UpdateFeatureFlagDto): Promise<ModuleFeatureFlag> {
    this.logger.log(`Updating feature flag ${id}`);
    
    const featureFlag = await this.findOne(id);
    
    const updated = await this.featureFlagRepository.save({
      ...featureFlag,
      ...updateDto,
    });
    
    // Emit event for feature flag update
    this.eventEmitter.emit('module.featureFlag.updated', updated);
    
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing feature flag ${id}`);
    
    const featureFlag = await this.findOne(id);
    await this.featureFlagRepository.remove(featureFlag);
    
    // Emit event for feature flag deletion
    this.eventEmitter.emit('module.featureFlag.deleted', { id });
  }

  async getFeatureFlagsForTenant(tenantId: string): Promise<Record<string, { 
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    configuration: Record<string, any>;
    moduleId: string;
    moduleName: string;
  }>> {
    // Get all active module installations for the tenant
    const installations = await this.installationRepository.find({
      where: { 
        tenantId,
        isActive: true,
      },
      relations: ['moduleVersion', 'moduleVersion.module'],
    });
    
    const moduleIds = installations.map(install => install.moduleVersion.module.id);
    
    // Get all feature flags for the installed modules
    const featureFlags = await this.featureFlagRepository.find({
      where: { moduleId: { $in: moduleIds } },
      relations: ['module'],
    });
    
    // Build the result with tenant-specific overrides
    const result: Record<string, any> = {};
    
    for (const flag of featureFlags) {
      const tenantOverrides = this.getTenantFeatureFlagOverride(tenantId, flag.id);
      
      result[flag.name] = {
        id: flag.id,
        name: flag.name,
        description: flag.description,
        isEnabled: tenantOverrides ? tenantOverrides.isEnabled : flag.isEnabled,
        configuration: tenantOverrides 
          ? { ...flag.configuration, ...tenantOverrides.configuration }
          : flag.configuration,
        moduleId: flag.moduleId,
        moduleName: flag.module.name,
      };
    }
    
    return result;
  }

  async setTenantFeatureFlagOverride(
    tenantId: string,
    dto: TenantFeatureFlagDto,
  ): Promise<void> {
    this.logger.log(`Setting feature flag override for tenant ${tenantId}, flag ${dto.featureFlagId}`);
    
    // Check if feature flag exists
    const featureFlag = await this.findOne(dto.featureFlagId);
    
    if (!featureFlag.isConfigurable) {
      throw new ConflictException(`Feature flag ${featureFlag.name} is not configurable`);
    }
    
    // Check if tenant has the module installed
    const installation = await this.installationRepository.findOne({
      where: { 
        tenantId,
        moduleVersion: { 
          module: { id: featureFlag.moduleId } 
        },
        isActive: true,
      },
    });
    
    if (!installation) {
      throw new ConflictException(`Module ${featureFlag.module.name} is not installed for tenant ${tenantId}`);
    }
    
    // Set override in cache
    if (!this.tenantFeatureFlagOverrides.has(tenantId)) {
      this.tenantFeatureFlagOverrides.set(tenantId, new Map());
    }
    
    const tenantMap = this.tenantFeatureFlagOverrides.get(tenantId);
    tenantMap.set(dto.featureFlagId, {
      isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : featureFlag.isEnabled,
      configuration: dto.configuration || {},
    });
    
    // Emit event for tenant feature flag override
    this.eventEmitter.emit('module.featureFlag.tenantOverride', {
      tenantId,
      featureFlagId: dto.featureFlagId,
      isEnabled: dto.isEnabled,
      configuration: dto.configuration,
    });
  }

  async removeTenantFeatureFlagOverride(
    tenantId: string,
    featureFlagId: string,
  ): Promise<void> {
    this.logger.log(`Removing feature flag override for tenant ${tenantId}, flag ${featureFlagId}`);
    
    // Check if feature flag exists
    await this.findOne(featureFlagId);
    
    // Remove override from cache
    if (this.tenantFeatureFlagOverrides.has(tenantId)) {
      const tenantMap = this.tenantFeatureFlagOverrides.get(tenantId);
      tenantMap.delete(featureFlagId);
      
      // Clean up empty maps
      if (tenantMap.size === 0) {
        this.tenantFeatureFlagOverrides.delete(tenantId);
      }
    }
    
    // Emit event for tenant feature flag override removal
    this.eventEmitter.emit('module.featureFlag.tenantOverrideRemoved', {
      tenantId,
      featureFlagId,
    });
  }

  private getTenantFeatureFlagOverride(
    tenantId: string,
    featureFlagId: string,
  ): { isEnabled: boolean; configuration: Record<string, any> } | null {
    const tenantMap = this.tenantFeatureFlagOverrides.get(tenantId);
    
    if (!tenantMap) {
      return null;
    }
    
    return tenantMap.get(featureFlagId) || null;
  }
}

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as semver from 'semver';
import { ModuleVersion } from './entities/module-version.entity';
import { CreateModuleVersionDto } from './dto/create-module-version.dto';
import { UpdateModuleVersionDto } from './dto/update-module-version.dto';
import { ModulesService } from '../modules/modules.service';

@Injectable()
export class ModuleVersionsService {
  constructor(
    @InjectRepository(ModuleVersion)
    private readonly moduleVersionRepository: Repository<ModuleVersion>,
    private readonly modulesService: ModulesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createModuleVersionDto: CreateModuleVersionDto): Promise<ModuleVersion> {
    // Verify that the module exists
    const module = await this.modulesService.findOne(createModuleVersionDto.moduleId);

    // Check if the version already exists for this module
    const existingVersion = await this.moduleVersionRepository.findOne({
      where: {
        moduleId: createModuleVersionDto.moduleId,
        version: createModuleVersionDto.version,
      } as FindOptionsWhere<ModuleVersion>,
    });

    if (existingVersion) {
      throw new ConflictException(
        `Version ${createModuleVersionDto.version} already exists for module ${module.name}`,
      );
    }

    // Validate version format
    if (!semver.valid(createModuleVersionDto.version)) {
      throw new BadRequestException(
        `Invalid version format: ${createModuleVersionDto.version}. Must be a valid semver version.`,
      );
    }

    // Create new module version
    const moduleVersion = this.moduleVersionRepository.create(createModuleVersionDto);
    const savedVersion = await this.moduleVersionRepository.save(moduleVersion);

    // Emit event
    this.eventEmitter.emit('module.version.created', {
      moduleId: module.id,
      moduleName: module.name,
      moduleVersion: savedVersion,
    });

    return savedVersion;
  }

  async findAll(moduleId: string): Promise<ModuleVersion[]> {
    // Verify that the module exists
    await this.modulesService.findOne(moduleId);

    return this.moduleVersionRepository.find({
      where: { moduleId } as FindOptionsWhere<ModuleVersion>,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ModuleVersion> {
    const moduleVersion = await this.moduleVersionRepository.findOne({
      where: { id } as FindOptionsWhere<ModuleVersion>,
      relations: ['module', 'dependencies'],
    });

    if (!moduleVersion) {
      throw new NotFoundException(`Module version with ID ${id} not found`);
    }

    return moduleVersion;
  }

  async findByModuleAndVersion(moduleId: string, version: string): Promise<ModuleVersion> {
    const moduleVersion = await this.moduleVersionRepository.findOne({
      where: {
        moduleId,
        version,
      } as FindOptionsWhere<ModuleVersion>,
      relations: ['module', 'dependencies'],
    });

    if (!moduleVersion) {
      throw new NotFoundException(`Version ${version} not found for module with ID ${moduleId}`);
    }

    return moduleVersion;
  }

  async getLatestVersion(moduleId: string, includePrerelease = false): Promise<ModuleVersion> {
    // Verify that the module exists
    await this.modulesService.findOne(moduleId);

    // Get all versions
    const versions = await this.moduleVersionRepository.find({
      where: {
        moduleId,
        isActive: true,
      } as FindOptionsWhere<ModuleVersion>,
    });

    if (versions.length === 0) {
      throw new NotFoundException(`No active versions found for module with ID ${moduleId}`);
    }

    // Find the latest version using semver
    const versionStrings = versions.map(v => v.version);
    const latestVersion = semver.maxSatisfying(versionStrings, '*', { includePrerelease });

    if (!latestVersion) {
      throw new NotFoundException(`Could not determine latest version for module with ID ${moduleId}`);
    }

    // Find the full version object
    const latestVersionObj = versions.find(v => v.version === latestVersion);
    return latestVersionObj;
  }

  async update(id: string, updateModuleVersionDto: UpdateModuleVersionDto): Promise<ModuleVersion> {
    const moduleVersion = await this.findOne(id);

    // Version number should not be changed after creation
    if (updateModuleVersionDto.version && updateModuleVersionDto.version !== moduleVersion.version) {
      throw new BadRequestException('Version number cannot be changed');
    }

    // Module ID should not be changed after creation
    if (updateModuleVersionDto.moduleId && updateModuleVersionDto.moduleId !== moduleVersion.moduleId) {
      throw new BadRequestException('Module ID cannot be changed');
    }

    // Update module version
    const updatedModuleVersion = await this.moduleVersionRepository.save({
      ...moduleVersion,
      ...updateModuleVersionDto,
    });

    // Emit event
    this.eventEmitter.emit('module.version.updated', {
      moduleId: moduleVersion.moduleId,
      moduleVersionId: moduleVersion.id,
      moduleVersion: updatedModuleVersion,
    });

    return updatedModuleVersion;
  }

  async deprecate(id: string): Promise<ModuleVersion> {
    const moduleVersion = await this.findOne(id);
    
    if (moduleVersion.isDeprecated) {
      return moduleVersion;
    }
    
    moduleVersion.isDeprecated = true;
    const updatedVersion = await this.moduleVersionRepository.save(moduleVersion);
    
    // Emit event
    this.eventEmitter.emit('module.version.deprecated', {
      moduleId: moduleVersion.moduleId,
      moduleVersionId: moduleVersion.id,
      version: moduleVersion.version,
    });
    
    return updatedVersion;
  }

  async activate(id: string): Promise<ModuleVersion> {
    const moduleVersion = await this.findOne(id);
    
    if (moduleVersion.isActive) {
      return moduleVersion;
    }
    
    moduleVersion.isActive = true;
    const updatedVersion = await this.moduleVersionRepository.save(moduleVersion);
    
    // Emit event
    this.eventEmitter.emit('module.version.activated', {
      moduleId: moduleVersion.moduleId,
      moduleVersionId: moduleVersion.id,
      version: moduleVersion.version,
    });
    
    return updatedVersion;
  }
  
  async deactivate(id: string): Promise<ModuleVersion> {
    const moduleVersion = await this.findOne(id);
    
    if (!moduleVersion.isActive) {
      return moduleVersion;
    }
    
    moduleVersion.isActive = false;
    const updatedVersion = await this.moduleVersionRepository.save(moduleVersion);
    
    // Emit event
    this.eventEmitter.emit('module.version.deactivated', {
      moduleId: moduleVersion.moduleId,
      moduleVersionId: moduleVersion.id,
      version: moduleVersion.version,
    });
    
    return updatedVersion;
  }

  async remove(id: string): Promise<void> {
    const moduleVersion = await this.findOne(id);

    // Check if this version is being used by any tenant
    // This would typically be done through a service that manages module installations
    // For now, we'll just emit an event and assume it's safe to delete

    await this.moduleVersionRepository.remove(moduleVersion);

    // Emit event
    this.eventEmitter.emit('module.version.deleted', {
      moduleId: moduleVersion.moduleId,
      moduleVersionId: id,
      version: moduleVersion.version,
    });
  }
}

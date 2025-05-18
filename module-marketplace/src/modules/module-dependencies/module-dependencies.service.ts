import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as semver from 'semver';
import { ModuleDependency } from './entities/module-dependency.entity';
import { CreateModuleDependencyDto } from './dto/create-module-dependency.dto';
import { UpdateModuleDependencyDto } from './dto/update-module-dependency.dto';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleVersion } from '../module-versions/entities/module-version.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ModuleDependenciesService {
  private readonly logger = new Logger(ModuleDependenciesService.name);

  constructor(
    @InjectRepository(ModuleDependency)
    private readonly dependencyRepository: Repository<ModuleDependency>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(ModuleVersion)
    private readonly versionRepository: Repository<ModuleVersion>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createDto: CreateModuleDependencyDto): Promise<ModuleDependency> {
    this.logger.log(`Creating dependency for version ${createDto.dependentVersionId} on module ${createDto.dependencyModuleId}`);
    
    // Validate the version requirement is a valid semver range
    if (!semver.validRange(createDto.versionRequirement)) {
      throw new ConflictException(`Invalid version requirement: ${createDto.versionRequirement}`);
    }
    
    // Validate that dependent version exists
    const dependentVersion = await this.versionRepository.findOne({
      where: { id: createDto.dependentVersionId },
    });
    
    if (!dependentVersion) {
      throw new NotFoundException(`Dependent version ${createDto.dependentVersionId} not found`);
    }
    
    // Validate that dependency module exists
    const dependencyModule = await this.moduleRepository.findOne({
      where: { id: createDto.dependencyModuleId },
    });
    
    if (!dependencyModule) {
      throw new NotFoundException(`Dependency module ${createDto.dependencyModuleId} not found`);
    }
    
    // Check for circular dependencies
    const circularDependency = await this.checkCircularDependency(
      createDto.dependentVersionId,
      createDto.dependencyModuleId,
    );
    
    if (circularDependency) {
      throw new ConflictException('Circular dependency detected');
    }
    
    // Create the dependency
    const dependency = this.dependencyRepository.create(createDto);
    const result = await this.dependencyRepository.save(dependency);
    
    // Emit event for dependency creation
    this.eventEmitter.emit('module.dependency.created', result);
    
    return result;
  }

  async findAll(): Promise<ModuleDependency[]> {
    return this.dependencyRepository.find({
      relations: ['dependentVersion', 'dependentVersion.module'],
    });
  }

  async findByDependentVersionId(dependentVersionId: string): Promise<ModuleDependency[]> {
    return this.dependencyRepository.find({
      where: { dependentVersionId },
      relations: ['dependentVersion', 'dependentVersion.module'],
    });
  }

  async findByDependencyModuleId(dependencyModuleId: string): Promise<ModuleDependency[]> {
    return this.dependencyRepository.find({
      where: { dependencyModuleId },
      relations: ['dependentVersion', 'dependentVersion.module'],
    });
  }

  async findOne(id: string): Promise<ModuleDependency> {
    const dependency = await this.dependencyRepository.findOne({
      where: { id },
      relations: ['dependentVersion', 'dependentVersion.module'],
    });
    
    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${id} not found`);
    }
    
    return dependency;
  }

  async update(id: string, updateDto: UpdateModuleDependencyDto): Promise<ModuleDependency> {
    this.logger.log(`Updating dependency ${id}`);
    
    const dependency = await this.findOne(id);
    
    // Validate the version requirement if it's being updated
    if (updateDto.versionRequirement && !semver.validRange(updateDto.versionRequirement)) {
      throw new ConflictException(`Invalid version requirement: ${updateDto.versionRequirement}`);
    }
    
    const updated = await this.dependencyRepository.save({
      ...dependency,
      ...updateDto,
    });
    
    // Emit event for dependency update
    this.eventEmitter.emit('module.dependency.updated', updated);
    
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing dependency ${id}`);
    
    const dependency = await this.findOne(id);
    await this.dependencyRepository.remove(dependency);
    
    // Emit event for dependency deletion
    this.eventEmitter.emit('module.dependency.deleted', { id });
  }

  private async checkCircularDependency(
    dependentVersionId: string,
    dependencyModuleId: string,
  ): Promise<boolean> {
    // Get the module ID of the dependent version
    const dependentVersion = await this.versionRepository.findOne({
      where: { id: dependentVersionId },
      relations: ['module'],
    });
    
    if (!dependentVersion) {
      return false;
    }
    
    const dependentModuleId = dependentVersion.module.id;
    
    // If the dependency module is the same as the dependent module, it's a direct circular dependency
    if (dependentModuleId === dependencyModuleId) {
      return true;
    }
    
    // Get all versions of the dependency module
    const dependencyVersions = await this.versionRepository.find({
      where: { module: { id: dependencyModuleId } },
    });
    
    // For each version of the dependency module, check if it depends on the dependent module
    for (const version of dependencyVersions) {
      const dependencies = await this.dependencyRepository.find({
        where: { dependentVersionId: version.id },
      });
      
      for (const dependency of dependencies) {
        if (dependency.dependencyModuleId === dependentModuleId) {
          return true;
        }
        
        // Recursively check for circular dependencies
        const isCircular = await this.checkCircularDependency(
          version.id,
          dependency.dependencyModuleId,
        );
        
        if (isCircular) {
          return true;
        }
      }
    }
    
    return false;
  }
}

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenantModule } from './entities/tenant-module.entity';
import { CreateTenantModuleDto } from './dto/create-tenant-module.dto';
import { UpdateTenantModuleDto } from './dto/update-tenant-module.dto';

@Injectable()
export class TenantModulesService {
  constructor(
    @InjectRepository(TenantModule)
    private readonly tenantModuleRepository: Repository<TenantModule>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createTenantModuleDto: CreateTenantModuleDto): Promise<TenantModule> {
    try {
      // Check if tenant-module association already exists
      const existingTenantModule = await this.tenantModuleRepository.findOne({
        where: {
          tenantId: createTenantModuleDto.tenantId,
          moduleId: createTenantModuleDto.moduleId
        }
      });

      if (existingTenantModule) {
        throw new ConflictException(
          `Tenant (${createTenantModuleDto.tenantId}) is already associated with this module (${createTenantModuleDto.moduleId})`
        );
      }

      // Create and save the new tenant-module association
      const tenantModule = this.tenantModuleRepository.create(createTenantModuleDto);
      const savedTenantModule = await this.tenantModuleRepository.save(tenantModule);

      // Emit event for tenant-module creation
      this.eventEmitter.emit('tenant-module.created', savedTenantModule);

      return savedTenantModule;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create tenant-module association: ${error.message}`);
    }
  }

  async findAll(): Promise<TenantModule[]> {
    try {
      return this.tenantModuleRepository.find({
        relations: ['tenant', 'module'],
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve tenant-module associations: ${error.message}`);
    }
  }

  async findByTenantId(tenantId: string): Promise<TenantModule[]> {
    try {
      return this.tenantModuleRepository.find({ 
        where: { tenantId },
        relations: ['module'],
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve modules for tenant ${tenantId}: ${error.message}`);
    }
  }

  async findByModuleId(moduleId: string): Promise<TenantModule[]> {
    try {
      return this.tenantModuleRepository.find({ 
        where: { moduleId },
        relations: ['tenant'],
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve tenants for module ${moduleId}: ${error.message}`);
    }
  }

  async findOne(tenantId: string, moduleId: string): Promise<TenantModule> {
    try {
      const tenantModule = await this.tenantModuleRepository.findOne({ 
        where: { tenantId, moduleId },
        relations: ['tenant', 'module'],
      });
      
      if (!tenantModule) {
        throw new NotFoundException(`Tenant module with tenantId ${tenantId} and moduleId ${moduleId} not found`);
      }
      
      return tenantModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve tenant-module association: ${error.message}`);
    }
  }

  async update(tenantId: string, moduleId: string, updateTenantModuleDto: UpdateTenantModuleDto): Promise<TenantModule> {
    try {
      const tenantModule = await this.findOne(tenantId, moduleId);
      
      const updatedTenantModule = this.tenantModuleRepository.merge(
        tenantModule,
        updateTenantModuleDto,
      );
      
      const savedTenantModule = await this.tenantModuleRepository.save(updatedTenantModule);

      // Emit event for tenant-module update
      this.eventEmitter.emit('tenant-module.updated', savedTenantModule);
      
      return savedTenantModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update tenant-module association: ${error.message}`);
    }
  }

  async remove(tenantId: string, moduleId: string): Promise<void> {
    try {
      const tenantModule = await this.findOne(tenantId, moduleId);
      await this.tenantModuleRepository.remove(tenantModule);

      // Emit event for tenant-module deletion
      this.eventEmitter.emit('tenant-module.deleted', {
        tenantId,
        moduleId,
        timestamp: new Date()
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete tenant-module association: ${error.message}`);
    }
  }

  async enableModule(tenantId: string, moduleId: string): Promise<TenantModule> {
    try {
      const tenantModule = await this.findOne(tenantId, moduleId);
      
      if (tenantModule.isEnabled) {
        return tenantModule; // Already enabled
      }
      
      tenantModule.isEnabled = true;
      const savedTenantModule = await this.tenantModuleRepository.save(tenantModule);

      // Emit event for module enablement
      this.eventEmitter.emit('tenant-module.enabled', savedTenantModule);
      
      return savedTenantModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to enable module: ${error.message}`);
    }
  }

  async disableModule(tenantId: string, moduleId: string): Promise<TenantModule> {
    try {
      const tenantModule = await this.findOne(tenantId, moduleId);
      
      if (!tenantModule.isEnabled) {
        return tenantModule; // Already disabled
      }
      
      tenantModule.isEnabled = false;
      const savedTenantModule = await this.tenantModuleRepository.save(tenantModule);

      // Emit event for module disablement
      this.eventEmitter.emit('tenant-module.disabled', savedTenantModule);
      
      return savedTenantModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to disable module: ${error.message}`);
    }
  }

  async updateModuleConfig(tenantId: string, moduleId: string, config: Record<string, any>): Promise<TenantModule> {
    try {
      const tenantModule = await this.findOne(tenantId, moduleId);
      
      // Merge existing config with new config
      tenantModule.config = {
        ...tenantModule.config || {},
        ...config
      };
      
      const savedTenantModule = await this.tenantModuleRepository.save(tenantModule);

      // Emit event for config update
      this.eventEmitter.emit('tenant-module.configUpdated', savedTenantModule);
      
      return savedTenantModule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update module configuration: ${error.message}`);
    }
  }

  async bulkEnableModules(tenantId: string, moduleIds: string[]): Promise<TenantModule[]> {
    try {
      const results: TenantModule[] = [];
      
      for (const moduleId of moduleIds) {
        try {
          const enabledModule = await this.enableModule(tenantId, moduleId);
          results.push(enabledModule);
        } catch (error) {
          // Log error but continue with other modules
          console.error(`Error enabling module ${moduleId} for tenant ${tenantId}:`, error.message);
        }
      }
      
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to bulk enable modules: ${error.message}`);
    }
  }

  async bulkDisableModules(tenantId: string, moduleIds: string[]): Promise<TenantModule[]> {
    try {
      const results: TenantModule[] = [];
      
      for (const moduleId of moduleIds) {
        try {
          const disabledModule = await this.disableModule(tenantId, moduleId);
          results.push(disabledModule);
        } catch (error) {
          // Log error but continue with other modules
          console.error(`Error disabling module ${moduleId} for tenant ${tenantId}:`, error.message);
        }
      }
      
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to bulk disable modules: ${error.message}`);
    }
  }
}

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Module } from './entities/module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    try {
      // Check if module with same name already exists
      const existingModule = await this.moduleRepository.findOne({
        where: { name: createModuleDto.name }
      });

      if (existingModule) {
        throw new ConflictException(`Module with name "${createModuleDto.name}" already exists`);
      }

      // Create and save the new module
      const newModule = this.moduleRepository.create(createModuleDto);
      const savedModule = await this.moduleRepository.save(newModule);

      // Emit event for module creation
      this.eventEmitter.emit('module.created', savedModule);

      return savedModule;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create module: ${error.message}`);
    }
  }

  async findAll(options?: FindOptionsWhere<Module>): Promise<Module[]> {
    try {
      return await this.moduleRepository.find({
        where: options,
        order: { name: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve modules: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Module> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id },
        relations: ['tenantModules']
      });

      if (!module) {
        throw new NotFoundException(`Module with ID "${id}" not found`);
      }

      return module;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve module: ${error.message}`);
    }
  }

  async findByName(name: string): Promise<Module> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { name }
      });

      if (!module) {
        throw new NotFoundException(`Module with name "${name}" not found`);
      }

      return module;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve module: ${error.message}`);
    }
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    try {
      // Check if module exists
      const existingModule = await this.findOne(id);

      // If updating name, check if new name already exists in another module
      if (updateModuleDto.name && updateModuleDto.name !== existingModule.name) {
        const nameExists = await this.moduleRepository.findOne({
          where: { name: updateModuleDto.name }
        });

        if (nameExists) {
          throw new ConflictException(`Module with name "${updateModuleDto.name}" already exists`);
        }
      }

      // Update the module
      await this.moduleRepository.update(id, updateModuleDto);
      
      // Retrieve and return the updated module
      const updatedModule = await this.findOne(id);
      
      // Emit event for module update
      this.eventEmitter.emit('module.updated', updatedModule);
      
      return updatedModule;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update module: ${error.message}`);
    }
  }

  async activate(id: string): Promise<Module> {
    try {
      const module = await this.findOne(id);
      
      if (module.isActive) {
        return module; // Already active, just return it
      }
      
      module.isActive = true;
      await this.moduleRepository.save(module);
      
      this.eventEmitter.emit('module.activated', module);
      
      return module;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to activate module: ${error.message}`);
    }
  }
  
  async deactivate(id: string): Promise<Module> {
    try {
      const module = await this.findOne(id);
      
      if (!module.isActive) {
        return module; // Already inactive, just return it
      }
      
      module.isActive = false;
      await this.moduleRepository.save(module);
      
      this.eventEmitter.emit('module.deactivated', module);
      
      return module;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to deactivate module: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if module exists
      const moduleToRemove = await this.findOne(id);
      
      // Check if module has associated tenant modules
      if (moduleToRemove.tenantModules && moduleToRemove.tenantModules.length > 0) {
        throw new BadRequestException(
          `Cannot delete module with ID "${id}" because it is associated with ${moduleToRemove.tenantModules.length} tenant(s)`
        );
      }
      
      // Delete the module
      const result = await this.moduleRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Module with ID "${id}" not found`);
      }
      
      // Emit event for module deletion
      this.eventEmitter.emit('module.deleted', { id, name: moduleToRemove.name });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete module: ${error.message}`);
    }
  }
}

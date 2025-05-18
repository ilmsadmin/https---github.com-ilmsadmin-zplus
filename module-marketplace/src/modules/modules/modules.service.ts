import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    // Check if module name or slug already exists
    const existingModule = await this.moduleRepository.findOne({
      where: [
        { name: createModuleDto.name } as FindOptionsWhere<Module>,
        { slug: createModuleDto.slug } as FindOptionsWhere<Module>,
      ],
    });

    if (existingModule) {
      if (existingModule.name === createModuleDto.name) {
        throw new ConflictException(`Module with name ${createModuleDto.name} already exists`);
      } else {
        throw new ConflictException(`Module with slug ${createModuleDto.slug} already exists`);
      }
    }

    // Create new module
    const module = this.moduleRepository.create(createModuleDto);
    const savedModule = await this.moduleRepository.save(module);

    // Emit event
    this.eventEmitter.emit('module.created', savedModule);

    return savedModule;
  }

  async findAll(options?: any): Promise<Module[]> {
    const queryOptions: any = {};
    
    // Apply filters
    if (options?.isActive !== undefined) {
      queryOptions.where = { 
        ...queryOptions.where,
        isActive: options.isActive 
      };
    }
    
    if (options?.type) {
      queryOptions.where = { 
        ...queryOptions.where,
        type: options.type 
      };
    }
    
    if (options?.isSystem !== undefined) {
      queryOptions.where = { 
        ...queryOptions.where,
        isSystem: options.isSystem 
      };
    }
    
    // Get modules with their latest versions
    return this.moduleRepository.find({
      ...queryOptions,
      relations: ['versions'],
    });
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id } as FindOptionsWhere<Module>,
      relations: ['versions'],
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return module;
  }

  async findBySlug(slug: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { slug } as FindOptionsWhere<Module>,
      relations: ['versions'],
    });

    if (!module) {
      throw new NotFoundException(`Module with slug ${slug} not found`);
    }

    return module;
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    const module = await this.findOne(id);

    // Check if slug is being updated and if it's unique
    if (updateModuleDto.slug && updateModuleDto.slug !== module.slug) {
      const existingModule = await this.moduleRepository.findOne({
        where: { slug: updateModuleDto.slug } as FindOptionsWhere<Module>,
      });

      if (existingModule) {
        throw new ConflictException(`Module with slug ${updateModuleDto.slug} already exists`);
      }
    }

    // Check if name is being updated and if it's unique
    if (updateModuleDto.name && updateModuleDto.name !== module.name) {
      const existingModule = await this.moduleRepository.findOne({
        where: { name: updateModuleDto.name } as FindOptionsWhere<Module>,
      });

      if (existingModule) {
        throw new ConflictException(`Module with name ${updateModuleDto.name} already exists`);
      }
    }

    // Update module
    const updatedModule = await this.moduleRepository.save({
      ...module,
      ...updateModuleDto,
    });

    // Emit event
    this.eventEmitter.emit('module.updated', updatedModule);

    return updatedModule;
  }

  async activate(id: string): Promise<Module> {
    const module = await this.findOne(id);
    
    if (module.isActive) {
      return module;
    }
    
    module.isActive = true;
    const updatedModule = await this.moduleRepository.save(module);
    
    // Emit event
    this.eventEmitter.emit('module.activated', updatedModule);
    
    return updatedModule;
  }
  
  async deactivate(id: string): Promise<Module> {
    const module = await this.findOne(id);
    
    if (!module.isActive) {
      return module;
    }
    
    module.isActive = false;
    const updatedModule = await this.moduleRepository.save(module);
    
    // Emit event
    this.eventEmitter.emit('module.deactivated', updatedModule);
    
    return updatedModule;
  }

  async remove(id: string): Promise<void> {
    const module = await this.findOne(id);

    // Check if this is a system module
    if (module.isSystem) {
      throw new BadRequestException('System modules cannot be removed');
    }

    // Check if the module has active installations
    // This would typically be done through a service that manages module installations
    // For now, we'll just emit an event and assume it's safe to delete

    await this.moduleRepository.remove(module);

    // Emit event
    this.eventEmitter.emit('module.deleted', { id, name: module.name, slug: module.slug });
  }
}

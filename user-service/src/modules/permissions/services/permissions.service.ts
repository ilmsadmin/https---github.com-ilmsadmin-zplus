import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, tenantContext: ITenantContext): Promise<Permission> {
    try {
      // Check if permission with same name already exists
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: createPermissionDto.name }
      });

      if (existingPermission) {
        throw new ConflictException(`Permission with name "${createPermissionDto.name}" already exists`);
      }

      // Create new permission
      const newPermission = this.permissionRepository.create(createPermissionDto);
      const savedPermission = await this.permissionRepository.save(newPermission);

      // Emit event for permission creation
      this.eventEmitter.emit('permission.created', {
        tenantId: tenantContext.tenantId,
        permission: savedPermission,
        userId: tenantContext.userId,
      });

      return savedPermission;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create permission: ${error.message}`);
    }
  }

  async findAll(tenantContext: ITenantContext, filter?: { resource?: string; action?: string; isSystem?: boolean }): Promise<Permission[]> {
    try {
      const where: FindOptionsWhere<Permission> = {};
      
      if (filter?.resource) {
        where.resource = filter.resource;
      }
      
      if (filter?.action) {
        where.action = filter.action;
      }
      
      if (filter?.isSystem !== undefined) {
        where.isSystem = filter.isSystem;
      }
      
      return await this.permissionRepository.find({
        where,
        order: {
          resource: 'ASC',
          action: 'ASC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get permissions: ${error.message}`);
    }
  }

  async findOne(id: string, tenantContext: ITenantContext): Promise<Permission> {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id },
      });

      if (!permission) {
        throw new NotFoundException(`Permission with ID "${id}" not found`);
      }

      return permission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get permission: ${error.message}`);
    }
  }

  async findByName(name: string, tenantContext: ITenantContext): Promise<Permission> {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { name },
      });

      if (!permission) {
        throw new NotFoundException(`Permission with name "${name}" not found`);
      }

      return permission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get permission: ${error.message}`);
    }
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto, tenantContext: ITenantContext): Promise<Permission> {
    try {
      // Check if permission exists
      const permission = await this.findOne(id, tenantContext);

      // Check if trying to update system permission
      if (permission.isSystem && updatePermissionDto.isSystem === false) {
        throw new BadRequestException('Cannot change system permission status to non-system');
      }

      // Check for name conflict if name is being updated
      if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
        const existingPermission = await this.permissionRepository.findOne({
          where: { name: updatePermissionDto.name }
        });

        if (existingPermission) {
          throw new ConflictException(`Permission with name "${updatePermissionDto.name}" already exists`);
        }
      }

      // Update permission
      const updatedPermission = await this.permissionRepository.save({
        ...permission,
        ...updatePermissionDto,
      });

      // Emit event for permission update
      this.eventEmitter.emit('permission.updated', {
        tenantId: tenantContext.tenantId,
        permission: updatedPermission,
        userId: tenantContext.userId,
      });

      return updatedPermission;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update permission: ${error.message}`);
    }
  }

  async remove(id: string, tenantContext: ITenantContext): Promise<void> {
    try {
      // Check if permission exists
      const permission = await this.findOne(id, tenantContext);

      // Prevent deletion of system permissions
      if (permission.isSystem) {
        throw new BadRequestException('System permissions cannot be deleted');
      }

      await this.permissionRepository.remove(permission);

      // Emit event for permission deletion
      this.eventEmitter.emit('permission.deleted', {
        tenantId: tenantContext.tenantId,
        permissionId: id,
        userId: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete permission: ${error.message}`);
    }
  }
  async findByResourceAndAction(resource: string, action: string, tenantContext: ITenantContext): Promise<Permission | null> {
    try {
      return await this.permissionRepository.findOne({
        where: { resource, action },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get permission: ${error.message}`);
    }
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    try {
      return await this.permissionRepository.find({
        where: { id: In(ids) }
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get permissions: ${error.message}`);
    }
  }

  async seedDefaultPermissions(tenantContext: ITenantContext): Promise<void> {
    const defaultPermissions = [
      // User permissions
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create users', isSystem: true },
      { name: 'user:read', resource: 'user', action: 'read', description: 'Read users', isSystem: true },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update users', isSystem: true },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users', isSystem: true },
      
      // Role permissions
      { name: 'role:create', resource: 'role', action: 'create', description: 'Create roles', isSystem: true },
      { name: 'role:read', resource: 'role', action: 'read', description: 'Read roles', isSystem: true },
      { name: 'role:update', resource: 'role', action: 'update', description: 'Update roles', isSystem: true },
      { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete roles', isSystem: true },
      
      // Permission permissions
      { name: 'permission:create', resource: 'permission', action: 'create', description: 'Create permissions', isSystem: true },
      { name: 'permission:read', resource: 'permission', action: 'read', description: 'Read permissions', isSystem: true },
      { name: 'permission:update', resource: 'permission', action: 'update', description: 'Update permissions', isSystem: true },
      { name: 'permission:delete', resource: 'permission', action: 'delete', description: 'Delete permissions', isSystem: true },
      
      // Team permissions
      { name: 'team:create', resource: 'team', action: 'create', description: 'Create teams', isSystem: true },
      { name: 'team:read', resource: 'team', action: 'read', description: 'Read teams', isSystem: true },
      { name: 'team:update', resource: 'team', action: 'update', description: 'Update teams', isSystem: true },
      { name: 'team:delete', resource: 'team', action: 'delete', description: 'Delete teams', isSystem: true },
      
      // Setting permissions
      { name: 'setting:create', resource: 'setting', action: 'create', description: 'Create settings', isSystem: true },
      { name: 'setting:read', resource: 'setting', action: 'read', description: 'Read settings', isSystem: true },
      { name: 'setting:update', resource: 'setting', action: 'update', description: 'Update settings', isSystem: true },
      { name: 'setting:delete', resource: 'setting', action: 'delete', description: 'Delete settings', isSystem: true },
    ];
    
    try {
      for (const permissionData of defaultPermissions) {
        const existingPermission = await this.permissionRepository.findOne({
          where: { name: permissionData.name }
        });
        
        if (!existingPermission) {
          await this.permissionRepository.save(
            this.permissionRepository.create(permissionData)
          );
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to seed default permissions: ${error.message}`);
    }
  }
}

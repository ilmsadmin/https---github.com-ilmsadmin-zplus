import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createRoleDto: CreateRoleDto, tenantContext: ITenantContext): Promise<Role> {
    try {
      // Check if role with same name already exists
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name }
      });

      if (existingRole) {
        throw new ConflictException(`Role with name "${createRoleDto.name}" already exists`);
      }

      // Create new role
      const newRole = this.roleRepository.create(createRoleDto);
      
      const savedRole = await this.roleRepository.save(newRole);

      // Assign permissions if specified
      if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
        await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
      }

      // Emit event for role creation
      this.eventEmitter.emit('role.created', {
        roleId: savedRole.id,
        name: savedRole.name,
        tenantId: tenantContext.tenantId,
        timestamp: new Date(),
      });

      // Retrieve the role with permissions
      const roleWithRelations = await this.findOne(savedRole.id, tenantContext);
      
      return roleWithRelations;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  async findAll(filter?: FindOptionsWhere<Role>, tenantContext?: ITenantContext): Promise<Role[]> {
    try {
      return await this.roleRepository.find({
        where: filter,
        relations: ['permissions'],
        order: { name: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve roles: ${error.message}`);
    }
  }

  async findOne(id: string, tenantContext?: ITenantContext): Promise<Role> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['permissions']
      });

      if (!role) {
        throw new NotFoundException(`Role with ID "${id}" not found`);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve role: ${error.message}`);
    }
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    try {
      const roles = await this.roleRepository.find({
        where: { id: In(ids) }
      });

      if (roles.length !== ids.length) {
        const foundIds = roles.map(role => role.id);
        const missingIds = ids.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Some roles not found: ${missingIds.join(', ')}`);
      }

      return roles;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve roles: ${error.message}`);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantContext?: ITenantContext): Promise<Role> {
    try {
      // Check if role exists
      const existingRole = await this.findOne(id, tenantContext);

      // If updating name, check if new name already exists in another role
      if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
        const nameExists = await this.roleRepository.findOne({
          where: { name: updateRoleDto.name }
        });

        if (nameExists) {
          throw new ConflictException(`Role with name "${updateRoleDto.name}" already exists`);
        }
      }

      // Update the role
      await this.roleRepository.update(id, updateRoleDto);
      
      // Update permissions if specified
      if (updateRoleDto.permissionIds) {
        await this.assignPermissions(id, updateRoleDto.permissionIds);
      }
      
      // Retrieve and return the updated role
      const updatedRole = await this.findOne(id, tenantContext);

      // Emit event for role update
      this.eventEmitter.emit('role.updated', {
        roleId: updatedRole.id,
        name: updatedRole.name,
        tenantId: tenantContext?.tenantId,
        timestamp: new Date(),
      });
      
      return updatedRole;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  async remove(id: string, tenantContext?: ITenantContext): Promise<void> {
    try {
      // Check if role exists
      const roleToRemove = await this.findOne(id, tenantContext);
      
      // Check if this is a system role
      if (roleToRemove.isSystem) {
        throw new BadRequestException(`Cannot delete system role with ID "${id}"`);
      }
      
      // Delete the role
      const result = await this.roleRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Role with ID "${id}" not found`);
      }
      
      // Emit event for role deletion
      this.eventEmitter.emit('role.deleted', {
        roleId: id,
        name: roleToRemove.name,
        tenantId: tenantContext?.tenantId,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions']
      });

      if (!role) {
        throw new NotFoundException(`Role with ID "${roleId}" not found`);
      }

      const permissions = await this.permissionsService.findByIds(permissionIds);
      role.permissions = permissions;
      await this.roleRepository.save(role);
    } catch (error) {
      throw new BadRequestException(`Failed to assign permissions: ${error.message}`);
    }
  }
}

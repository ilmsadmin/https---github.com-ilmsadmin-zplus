import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RolesService } from '../../roles/services/roles.service';
import { TeamsService } from '../../teams/services/teams.service';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly teamsService: TeamsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto, tenantContext: ITenantContext): Promise<User> {
    try {
      // Check if user with same email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Create new user
      const newUser = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(newUser);

      // Assign roles if specified
      if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
        await this.assignRoles(savedUser.id, createUserDto.roleIds);
      }

      // Assign teams if specified
      if (createUserDto.teamIds && createUserDto.teamIds.length > 0) {
        await this.assignTeams(savedUser.id, createUserDto.teamIds);
      }

      // Emit event for user creation
      this.eventEmitter.emit('user.created', {
        userId: savedUser.id,
        email: savedUser.email,
        tenantId: tenantContext.tenantId,
        timestamp: new Date(),
      });

      // Retrieve the user with roles and teams
      const userWithRelations = await this.findOne(savedUser.id, tenantContext);
      
      return userWithRelations;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(filter?: FindOptionsWhere<User>, tenantContext?: ITenantContext): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: filter,
        relations: ['roles', 'teams'],
        order: { firstName: 'ASC', lastName: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve users: ${error.message}`);
    }
  }

  async findOne(id: string, tenantContext?: ITenantContext): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['roles', 'teams']
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve user: ${error.message}`);
    }
  }

  async findByEmail(email: string, tenantContext?: ITenantContext): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['roles', 'teams']
      });

      if (!user) {
        throw new NotFoundException(`User with email "${email}" not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve user: ${error.message}`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantContext?: ITenantContext): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.findOne(id, tenantContext);

      // If updating password, hash it
      if (updateUserDto.newPassword) {
        updateUserDto['password'] = await this.hashPassword(updateUserDto.newPassword);
        delete updateUserDto.newPassword;
      }

      // Update the user
      await this.userRepository.update(id, updateUserDto);
      
      // Update roles if specified
      if (updateUserDto.roleIds) {
        await this.assignRoles(id, updateUserDto.roleIds);
      }
      
      // Update teams if specified
      if (updateUserDto.teamIds) {
        await this.assignTeams(id, updateUserDto.teamIds);
      }
      
      // Retrieve and return the updated user
      const updatedUser = await this.findOne(id, tenantContext);

      // Emit event for user update
      this.eventEmitter.emit('user.updated', {
        userId: updatedUser.id,
        email: updatedUser.email,
        tenantId: tenantContext?.tenantId,
        timestamp: new Date(),
        sendNotification: updateUserDto.sendNotification,
      });
      
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string, tenantContext?: ITenantContext): Promise<void> {
    try {
      // Check if user exists
      const userToRemove = await this.findOne(id, tenantContext);
      
      // Soft delete the user (update status to DELETED)
      await this.userRepository.update(id, { status: UserStatus.DELETED });
      
      // Emit event for user deletion
      this.eventEmitter.emit('user.deleted', {
        userId: id,
        email: userToRemove.email,
        tenantId: tenantContext?.tenantId,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async hardRemove(id: string, tenantContext?: ITenantContext): Promise<void> {
    try {
      // Check if user exists
      const userToRemove = await this.findOne(id, tenantContext);
      
      // Hard delete the user
      await this.userRepository.delete(id);
      
      // Emit event for user deletion
      this.eventEmitter.emit('user.hard-deleted', {
        userId: id,
        email: userToRemove.email,
        tenantId: tenantContext?.tenantId,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to hard delete user: ${error.message}`);
    }
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['roles']
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      const roles = await this.rolesService.findByIds(roleIds);
      user.roles = roles;
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(`Failed to assign roles: ${error.message}`);
    }
  }

  async assignTeams(userId: string, teamIds: string[]): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['teams']
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      const teams = await this.teamsService.findByIds(teamIds);
      user.teams = teams;
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(`Failed to assign teams: ${error.message}`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainTextPassword, hashedPassword);
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify password');
    }  }

  // Helper method to get user with password field
  async getUserWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, status: UserStatus.ACTIVE },
      select: ['id', 'email', 'password', 'mfaEnabled', 'mfaSecret']
    });
  }

  async findByEmail(email: string, tenantContext: ITenantContext): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['roles', 'teams'],
      });

      if (!user) {
        throw new NotFoundException(`User with email "${email}" not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get user: ${error.message}`);
    }
  }

  async findByIds(ids: string[], tenantContext: ITenantContext): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: { id: In(ids) },
        relations: ['roles', 'teams'],
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get users: ${error.message}`);
    }
  }

  async softDelete(id: string, tenantContext: ITenantContext): Promise<void> {
    try {
      // Check if user exists
      const user = await this.findOne(id, tenantContext);

      // Update user status to DELETED
      await this.userRepository.update(id, {
        status: UserStatus.DELETED,
      });

      // Emit event for user soft deletion
      this.eventEmitter.emit('user.soft-deleted', {
        tenantId: tenantContext.tenantId,
        userId: id,
        deletedBy: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to soft delete user: ${error.message}`);
    }
  }
}

import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Team } from '../entities/team.entity';
import { User } from '../../users/entities/user.entity';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createTeamDto: CreateTeamDto, tenantContext: ITenantContext): Promise<Team> {
    try {
      // Check parent team if specified
      if (createTeamDto.parentId) {
        const parentTeam = await this.teamRepository.findOne({
          where: { id: createTeamDto.parentId },
        });

        if (!parentTeam) {
          throw new NotFoundException(`Parent team with ID "${createTeamDto.parentId}" not found`);
        }
      }

      // Create new team
      const newTeam = this.teamRepository.create(createTeamDto);
      const savedTeam = await this.teamRepository.save(newTeam);

      // Assign members if specified
      if (createTeamDto.memberIds && createTeamDto.memberIds.length > 0) {
        await this.assignMembers(savedTeam.id, createTeamDto.memberIds, tenantContext);
      }

      // Emit event for team creation
      this.eventEmitter.emit('team.created', {
        tenantId: tenantContext.tenantId,
        team: savedTeam,
        userId: tenantContext.userId,
      });

      return this.findOne(savedTeam.id, tenantContext);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create team: ${error.message}`);
    }
  }

  async findAll(tenantContext: ITenantContext, parentId?: string): Promise<Team[]> {
    try {
      const where: FindOptionsWhere<Team> = {};
      
      if (parentId !== undefined) {
        where.parentId = parentId;
      }
      
      return await this.teamRepository.find({
        where,
        order: {
          name: 'ASC',
        },
        relations: ['parent', 'children'],
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get teams: ${error.message}`);
    }
  }

  async findOne(id: string, tenantContext: ITenantContext): Promise<Team> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id },
        relations: ['parent', 'children', 'members'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${id}" not found`);
      }

      return team;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get team: ${error.message}`);
    }
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, tenantContext: ITenantContext): Promise<Team> {
    try {
      // Check if team exists
      const team = await this.findOne(id, tenantContext);

      // Check parent team if specified
      if (updateTeamDto.parentId) {
        // Prevent circular parent references
        if (updateTeamDto.parentId === id) {
          throw new BadRequestException('Team cannot be its own parent');
        }

        const parentTeam = await this.teamRepository.findOne({
          where: { id: updateTeamDto.parentId },
        });

        if (!parentTeam) {
          throw new NotFoundException(`Parent team with ID "${updateTeamDto.parentId}" not found`);
        }

        // Check for circular references in the hierarchy
        await this.validateNoCircularReference(id, updateTeamDto.parentId);
      }

      // Handle member updates
      if (updateTeamDto.memberIds !== undefined) {
        await this.updateMembers(id, updateTeamDto.memberIds, tenantContext);
      }

      // Remove memberIds to avoid TypeORM errors
      const { memberIds, ...updateData } = updateTeamDto;

      // Update team
      await this.teamRepository.update(id, updateData);
      const updatedTeam = await this.findOne(id, tenantContext);

      // Emit event for team update
      this.eventEmitter.emit('team.updated', {
        tenantId: tenantContext.tenantId,
        team: updatedTeam,
        userId: tenantContext.userId,
      });

      return updatedTeam;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update team: ${error.message}`);
    }
  }

  async remove(id: string, tenantContext: ITenantContext): Promise<void> {
    try {
      // Check if team exists
      const team = await this.findOne(id, tenantContext);

      // Check if team has children
      if (team.children && team.children.length > 0) {
        throw new BadRequestException('Cannot delete team with child teams. Please move or delete child teams first.');
      }

      // Remove the team
      await this.teamRepository.remove(team);

      // Emit event for team deletion
      this.eventEmitter.emit('team.deleted', {
        tenantId: tenantContext.tenantId,
        teamId: id,
        userId: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete team: ${error.message}`);
    }
  }

  async assignMembers(teamId: string, userIds: string[], tenantContext: ITenantContext): Promise<void> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['members'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      const users = await this.userRepository.findBy({ id: In(userIds) });

      if (users.length !== userIds.length) {
        const foundIds = users.map(user => user.id);
        const missingIds = userIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Users with IDs ${missingIds.join(', ')} not found`);
      }

      team.members = users;
      await this.teamRepository.save(team);

      // Emit event for member assignment
      this.eventEmitter.emit('team.members.assigned', {
        tenantId: tenantContext.tenantId,
        teamId,
        userIds,
        userId: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to assign members: ${error.message}`);
    }
  }

  async updateMembers(teamId: string, userIds: string[], tenantContext: ITenantContext): Promise<void> {
    return this.assignMembers(teamId, userIds, tenantContext);
  }

  async removeMember(teamId: string, userId: string, tenantContext: ITenantContext): Promise<void> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['members'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      const memberIndex = team.members.findIndex(member => member.id === userId);
      if (memberIndex === -1) {
        throw new NotFoundException(`User with ID "${userId}" is not a member of this team`);
      }

      team.members.splice(memberIndex, 1);
      await this.teamRepository.save(team);

      // Emit event for member removal
      this.eventEmitter.emit('team.member.removed', {
        tenantId: tenantContext.tenantId,
        teamId,
        userId,
        removedBy: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to remove team member: ${error.message}`);
    }
  }

  async getTeamMembers(teamId: string, tenantContext: ITenantContext): Promise<User[]> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['members'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      return team.members;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get team members: ${error.message}`);
    }
  }

  async getTeamHierarchy(teamId: string, tenantContext: ITenantContext): Promise<Team> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['children', 'members'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID "${teamId}" not found`);
      }

      // Recursively load children
      if (team.children && team.children.length > 0) {
        const childrenWithData = await Promise.all(
          team.children.map(child => this.getTeamHierarchy(child.id, tenantContext))
        );
        team.children = childrenWithData;
      }

      return team;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get team hierarchy: ${error.message}`);
    }
  }

  async getUserTeams(userId: string, tenantContext: ITenantContext): Promise<Team[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['teams'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      return user.teams;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get user teams: ${error.message}`);
    }
  }

  async findByIds(ids: string[]): Promise<Team[]> {
    try {
      return await this.teamRepository.find({
        where: { id: In(ids) },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get teams: ${error.message}`);
    }
  }

  private async validateNoCircularReference(teamId: string, parentId: string): Promise<void> {
    // Function to check that teamId doesn't appear in the parent chain of parentId
    const findInParentChain = async (currentParentId: string, originalTeamId: string, visitedIds: Set<string> = new Set()): Promise<boolean> => {
      if (currentParentId === originalTeamId) {
        return true; // Found a circular reference
      }
      
      if (visitedIds.has(currentParentId)) {
        return false; // Already visited this branch, no circular reference found here
      }
      
      visitedIds.add(currentParentId);
      
      const parent = await this.teamRepository.findOne({
        where: { id: currentParentId },
        select: ['parentId'],
      });
      
      if (!parent || !parent.parentId) {
        return false; // No more parents to check
      }
      
      return findInParentChain(parent.parentId, originalTeamId, visitedIds);
    };
    
    if (await findInParentChain(parentId, teamId)) {
      throw new BadRequestException('Circular team hierarchy detected. A team cannot be a descendant of itself.');
    }
  }
}

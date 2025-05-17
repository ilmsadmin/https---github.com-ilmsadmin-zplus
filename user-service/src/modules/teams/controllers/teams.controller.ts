import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { TeamsService } from '../services/teams.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { Team } from '../entities/team.entity';
import { User } from '../../users/entities/user.entity';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The team has been successfully created.',
    type: Team,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent team not found.',
  })
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team> {
    return this.teamsService.create(createTeamDto, tenantContext);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of teams retrieved successfully.',
    type: [Team],
  })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent team ID' })
  async findAll(
    @TenantContext() tenantContext: ITenantContext,
    @Query('parentId') parentId?: string,
  ): Promise<Team[]> {
    return this.teamsService.findAll(tenantContext, parentId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team retrieved successfully.',
    type: Team,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team not found.',
  })
  async findOne(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team> {
    return this.teamsService.findOne(id, tenantContext);
  }

  @Get(':id/hierarchy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get team hierarchy' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team hierarchy retrieved successfully.',
    type: Team,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team not found.',
  })
  async getTeamHierarchy(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team> {
    return this.teamsService.getTeamHierarchy(id, tenantContext);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team updated successfully.',
    type: Team,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or circular hierarchy detected.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team> {
    return this.teamsService.update(id, updateTeamDto, tenantContext);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Team deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete team with child teams.',
  })
  async remove(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    return this.teamsService.remove(id, tenantContext);
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get team members' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team members retrieved successfully.',
    type: [User],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team not found.',
  })
  async getTeamMembers(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<User[]> {
    return this.teamsService.getTeamMembers(id, tenantContext);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign members to team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Members assigned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team or users not found.',
  })
  async assignMembers(
    @Param('id') id: string,
    @Body() { userIds }: { userIds: string[] },
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<{ message: string }> {
    await this.teamsService.assignMembers(id, userIds, tenantContext);
    return { message: 'Members assigned successfully' };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Member removed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Team or user not found.',
  })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    return this.teamsService.removeMember(id, userId, tenantContext);
  }

  @Get('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get teams by IDs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams retrieved successfully.',
    type: [Team],
  })
  async getTeamsByIds(
    @Query('ids') ids: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team[]> {
    const teamIds = ids.split(',');
    return this.teamsService.findByIds(teamIds);
  }

  @Get('/user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get teams for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User teams retrieved successfully.',
    type: [Team],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async getUserTeams(
    @Param('userId') userId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Team[]> {
    return this.teamsService.getUserTeams(userId, tenantContext);
  }
}

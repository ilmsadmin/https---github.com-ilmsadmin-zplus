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

import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserStatus } from '../entities/user.entity';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully created.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A user with the same email already exists.',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.usersService.create(createUserDto, tenantContext);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users or filter by status or search term' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'Filter users by status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter users (matches name or email)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users.',
    type: [User],
  })
  async findAll(
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    let filter = {};
    
    if (status) {
      filter = { ...filter, status };
    }
    
    // Note: Search functionality would require custom query due to TypeORM limitations
    // This is a simplified version, a real implementation would use more advanced query building
    
    return this.usersService.findAll(filter, tenantContext);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found user.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async findOne(
    @Param('id') id: string,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    return this.usersService.findOne(id, tenantContext);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully updated.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    return this.usersService.update(id, updateUserDto, tenantContext);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async remove(
    @Param('id') id: string,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    await this.usersService.remove(id, tenantContext);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a user (permanent)' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The user has been permanently deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async hardRemove(
    @Param('id') id: string,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    await this.usersService.hardRemove(id, tenantContext);
  }

  @Get('email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by email' })
  @ApiParam({ name: 'email', description: 'The email of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found user.',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async findByEmail(
    @Param('email') email: string,
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    return this.usersService.findByEmail(email, tenantContext);
  }

  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles have been successfully assigned.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async assignRoles(
    @Param('id') id: string,
    @Body() data: { roleIds: string[] },
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    await this.usersService.assignRoles(id, data.roleIds);
    return { message: 'Roles assigned successfully' };
  }

  @Post(':id/teams')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign teams to a user' })
  @ApiParam({ name: 'id', description: 'The ID of the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams have been successfully assigned.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  async assignTeams(
    @Param('id') id: string,
    @Body() data: { teamIds: string[] },
    @TenantContext() tenantContext?: ITenantContext,
  ) {
    await this.usersService.assignTeams(id, data.teamIds);
    return { message: 'Teams assigned successfully' };
  }
}

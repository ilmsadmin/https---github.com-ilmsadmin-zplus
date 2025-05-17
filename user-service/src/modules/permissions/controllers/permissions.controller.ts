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

import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '../entities/permission.entity';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The permission has been successfully created.',
    type: Permission,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A permission with the same name already exists.',
  })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Permission> {
    return this.permissionsService.create(createPermissionDto, tenantContext);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of permissions retrieved successfully.',
    type: [Permission],
  })
  @ApiQuery({ name: 'resource', required: false, description: 'Filter by resource' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'isSystem', required: false, description: 'Filter by system status' })
  async findAll(
    @TenantContext() tenantContext: ITenantContext,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
    @Query('isSystem') isSystem?: boolean,
  ): Promise<Permission[]> {
    return this.permissionsService.findAll(tenantContext, {
      resource,
      action,
      isSystem: isSystem === undefined ? undefined : isSystem === true || isSystem === 'true',
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission retrieved successfully.',
    type: Permission,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found.',
  })
  async findOne(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Permission> {
    return this.permissionsService.findOne(id, tenantContext);
  }

  @Get('name/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a permission by name' })
  @ApiParam({ name: 'name', description: 'Permission name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission retrieved successfully.',
    type: Permission,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found.',
  })
  async findByName(
    @Param('name') name: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Permission> {
    return this.permissionsService.findByName(name, tenantContext);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission updated successfully.',
    type: Permission,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A permission with the same name already exists.',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Permission> {
    return this.permissionsService.update(id, updatePermissionDto, tenantContext);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Permission deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'System permissions cannot be deleted.',
  })
  async remove(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    return this.permissionsService.remove(id, tenantContext);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default permissions seeded successfully.',
  })
  async seedDefaultPermissions(
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<{ message: string }> {
    await this.permissionsService.seedDefaultPermissions(tenantContext);
    return { message: 'Default permissions seeded successfully' };
  }
}

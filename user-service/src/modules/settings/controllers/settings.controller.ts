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

import { SettingsService } from '../services/settings.service';
import { CreateUserSettingDto } from '../dto/create-user-setting.dto';
import { UpdateUserSettingDto } from '../dto/update-user-setting.dto';
import { UserSetting } from '../entities/user-setting.entity';
import { TenantContext } from '../../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user setting' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user setting has been successfully created.',
    type: UserSetting,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A setting with the same key already exists for this user.',
  })
  async create(
    @Body() createUserSettingDto: CreateUserSettingDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting> {
    return this.settingsService.create(createUserSettingDto, tenantContext);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update multiple user settings' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user settings have been successfully created or updated.',
    type: [UserSetting],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async bulkCreateOrUpdate(
    @Body() settings: CreateUserSettingDto[],
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting[]> {
    return this.settingsService.bulkCreateOrUpdate(settings, tenantContext);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of user settings retrieved successfully.',
    type: [UserSetting],
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async findAll(
    @TenantContext() tenantContext: ITenantContext,
    @Query('userId') userId?: string,
    @Query('category') category?: string,
  ): Promise<UserSetting[]> {
    return this.settingsService.findAll(tenantContext, { userId, category });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user setting by ID' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User setting retrieved successfully.',
    type: UserSetting,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User setting not found.',
  })
  async findOne(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting> {
    return this.settingsService.findOne(id, tenantContext);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get settings for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User settings retrieved successfully.',
    type: [UserSetting],
  })
  async getSettingsByUser(
    @Param('userId') userId: string,
    @Query('category') category: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting[]> {
    return this.settingsService.getSettingsByUser(userId, tenantContext, category);
  }

  @Get('user/:userId/key/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific setting for a user by key' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User setting retrieved successfully.',
    type: UserSetting,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User setting not found.',
  })
  async findByKey(
    @Param('userId') userId: string,
    @Param('key') key: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting> {
    return this.settingsService.findByKey(userId, key, tenantContext);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user setting' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User setting updated successfully.',
    type: UserSetting,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User setting not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserSettingDto: UpdateUserSettingDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<UserSetting> {
    return this.settingsService.update(id, updateUserSettingDto, tenantContext);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user setting' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User setting deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User setting not found.',
  })
  async remove(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    return this.settingsService.remove(id, tenantContext);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all settings for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User settings deleted successfully.',
  })
  async deleteSettingsByUser(
    @Param('userId') userId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    return this.settingsService.deleteSettingsByUser(userId, tenantContext);
  }
}

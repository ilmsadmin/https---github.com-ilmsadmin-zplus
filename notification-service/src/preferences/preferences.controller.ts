import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationChannel } from '../notifications/enums/notification-channel.enum';
import { TenantIdFromReq } from '../common/decorators/tenant-id.decorator';

@ApiTags('preferences')
@Controller('preferences')
export class PreferencesController {
  private readonly logger = new Logger(PreferencesController.name);

  constructor(private readonly preferencesService: PreferencesService) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get all notification preferences for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return all preferences for the user.', type: [NotificationPreference] })
  async getUserPreferences(
    @Param('userId') userId: string,
    @TenantIdFromReq() tenantId: string,
  ): Promise<NotificationPreference[]> {
    this.logger.log(`Retrieving preferences for user ${userId} in tenant ${tenantId}`);
    return this.preferencesService.getPreferences(userId, tenantId);
  }

  @Get('users/:userId/categories/:categoryCode')
  @ApiOperation({ summary: 'Get notification preferences for a specific category' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'categoryCode', description: 'Category code' })
  @ApiResponse({ status: 200, description: 'Return preferences for the specified category.', type: NotificationPreference })
  async getPreferencesByCategory(
    @Param('userId') userId: string,
    @Param('categoryCode') categoryCode: string,
    @TenantIdFromReq() tenantId: string,
  ): Promise<NotificationPreference> {
    this.logger.log(`Retrieving preferences for user ${userId}, category ${categoryCode} in tenant ${tenantId}`);
    return this.preferencesService.getPreferencesByCategory(userId, tenantId, categoryCode);
  }

  @Put('users/:userId/categories/:categoryCode')
  @ApiOperation({ summary: 'Update notification preferences for a specific category' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'categoryCode', description: 'Category code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabledChannels: {
          type: 'array',
          items: { enum: Object.values(NotificationChannel) },
        },
        isEnabled: { type: 'boolean' },
        email: { type: 'string' },
        phone: { type: 'string' },
        deviceTokens: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully.', type: NotificationPreference })
  async updatePreferences(
    @Param('userId') userId: string,
    @Param('categoryCode') categoryCode: string,
    @Body() updateData: any,
    @TenantIdFromReq() tenantId: string,
  ): Promise<NotificationPreference> {
    this.logger.log(`Updating preferences for user ${userId}, category ${categoryCode} in tenant ${tenantId}`);
    return this.preferencesService.createOrUpdatePreference(userId, tenantId, categoryCode, updateData);
  }

  @Post('users/:userId/device-tokens')
  @ApiOperation({ summary: 'Add a device token for push notifications' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceToken: { type: 'string' },
      },
      required: ['deviceToken'],
    },
  })
  @ApiResponse({ status: 201, description: 'Device token added successfully.' })
  async addDeviceToken(
    @Param('userId') userId: string,
    @Body('deviceToken') deviceToken: string,
    @TenantIdFromReq() tenantId: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Adding device token for user ${userId} in tenant ${tenantId}`);
    await this.preferencesService.addDeviceToken(userId, tenantId, deviceToken);
    return { success: true };
  }

  @Delete('users/:userId/device-tokens/:deviceToken')
  @ApiOperation({ summary: 'Remove a device token' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'deviceToken', description: 'Device token to remove' })
  @ApiResponse({ status: 200, description: 'Device token removed successfully.' })
  async removeDeviceToken(
    @Param('userId') userId: string,
    @Param('deviceToken') deviceToken: string,
    @TenantIdFromReq() tenantId: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Removing device token for user ${userId} in tenant ${tenantId}`);
    await this.preferencesService.removeDeviceToken(userId, tenantId, deviceToken);
    return { success: true };
  }

  @Put('users/:userId/categories/:categoryCode/channels/:channel/disable')
  @ApiOperation({ summary: 'Disable a specific notification channel for a category' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'categoryCode', description: 'Category code' })
  @ApiParam({ name: 'channel', description: 'Notification channel', enum: NotificationChannel })
  @ApiResponse({ status: 200, description: 'Channel disabled successfully.', type: NotificationPreference })
  async disableChannel(
    @Param('userId') userId: string,
    @Param('categoryCode') categoryCode: string,
    @Param('channel') channel: NotificationChannel,
    @TenantIdFromReq() tenantId: string,
  ): Promise<NotificationPreference> {
    this.logger.log(`Disabling ${channel} channel for user ${userId}, category ${categoryCode} in tenant ${tenantId}`);
    return this.preferencesService.disableChannel(userId, tenantId, categoryCode, channel);
  }

  @Put('users/:userId/categories/:categoryCode/channels/:channel/enable')
  @ApiOperation({ summary: 'Enable a specific notification channel for a category' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'categoryCode', description: 'Category code' })
  @ApiParam({ name: 'channel', description: 'Notification channel', enum: NotificationChannel })
  @ApiResponse({ status: 200, description: 'Channel enabled successfully.', type: NotificationPreference })
  async enableChannel(
    @Param('userId') userId: string,
    @Param('categoryCode') categoryCode: string,
    @Param('channel') channel: NotificationChannel,
    @TenantIdFromReq() tenantId: string,
  ): Promise<NotificationPreference> {
    this.logger.log(`Enabling ${channel} channel for user ${userId}, category ${categoryCode} in tenant ${tenantId}`);
    return this.preferencesService.enableChannel(userId, tenantId, categoryCode, channel);
  }
}

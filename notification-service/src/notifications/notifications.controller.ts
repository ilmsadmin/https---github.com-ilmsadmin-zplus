import { Controller, Get, Post, Body, Param, Query, Patch, Delete, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationChannel } from './enums/notification-channel.enum';
import { TenantIdFromReq } from '../common/decorators/tenant-id.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'The notification has been successfully created.', type: Notification })
  async create(@Body() createNotificationDto: CreateNotificationDto, @TenantIdFromReq() tenantId: string): Promise<Notification> {
    // Inject tenant ID from request context if not provided in DTO
    if (!createNotificationDto.tenantId) {
      createNotificationDto.tenantId = tenantId;
    }
    
    this.logger.log(`Creating notification for tenant ${createNotificationDto.tenantId}`);
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications.', type: [Notification] })
  async findAll(
    @Query() queryDto: NotificationQueryDto,
    @TenantIdFromReq() tenantId: string
  ): Promise<{ items: Notification[]; total: number }> {
    // Inject tenant ID from request context if not provided in query
    if (!queryDto.tenantId) {
      queryDto.tenantId = tenantId;
    }
    
    this.logger.log(`Retrieving notifications for tenant ${queryDto.tenantId}`);
    return this.notificationsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Return the notification.', type: Notification })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async findOne(@Param('id') id: string, @TenantIdFromReq() tenantId: string): Promise<Notification> {
    this.logger.log(`Retrieving notification ${id} for tenant ${tenantId}`);
    return this.notificationsService.findOne(id, tenantId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'The notification has been marked as read.', type: Notification })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async markAsRead(@Param('id') id: string, @TenantIdFromReq() tenantId: string): Promise<Notification> {
    this.logger.log(`Marking notification ${id} as read for tenant ${tenantId}`);
    return this.notificationsService.markAsRead(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'The notification has been cancelled.', type: Notification })
  @ApiResponse({ status: 400, description: 'Cannot cancel notification with current status.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async cancel(@Param('id') id: string, @TenantIdFromReq() tenantId: string): Promise<Notification> {
    this.logger.log(`Cancelling notification ${id} for tenant ${tenantId}`);
    return this.notificationsService.cancel(id, tenantId);
  }
}

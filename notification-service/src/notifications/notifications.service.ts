import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationStatus } from './enums/notification-status.enum';
import { NotificationChannel } from './enums/notification-channel.enum';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2,
    private templatesService: TemplatesService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const { templateId, templateCode, variables, ...notificationData } = createNotificationDto;
    
    // Handle template if provided
    if (templateId || templateCode) {
      let template;
      if (templateId) {
        template = await this.templatesService.findById(templateId, createNotificationDto.tenantId);
      } else if (templateCode) {
        template = await this.templatesService.findByCode(templateCode, createNotificationDto.tenantId);
      }
      
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // Check if template supports requested channels
      if (notificationData.channels.some(channel => !template.supportedChannels.includes(channel))) {
        throw new BadRequestException('Template does not support some of the requested channels');
      }

      // Apply template content based on variables
      const renderedTemplate = await this.templatesService.renderTemplate(template, variables || {});
      
      // Merge rendered template with notification data
      Object.assign(notificationData, {
        templateId: template.id,
        subject: renderedTemplate.subject || notificationData.subject,
        content: renderedTemplate.content || notificationData.content,
        metadata: {
          ...notificationData.metadata,
          originalTemplate: template.code,
          variables
        }
      });
    }

    // Create notification entity
    const notification = this.notificationRepository.create({
      ...notificationData,
      status: notificationData.scheduledFor 
        ? NotificationStatus.SCHEDULED 
        : NotificationStatus.PENDING,
    });

    // Save notification to database
    const savedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Created notification with ID: ${savedNotification.id}`);

    // Emit event for processing
    if (savedNotification.status === NotificationStatus.PENDING) {
      this.eventEmitter.emit('notification.created', savedNotification);
    }

    return savedNotification;
  }

  async findAll(queryDto: NotificationQueryDto): Promise<{ items: Notification[]; total: number }> {
    const { page = 1, limit = 20, ...filters } = queryDto;
    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<Notification> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      where: {},
    };

    // Apply filters
    if (filters.tenantId) {
      queryOptions.where['tenantId'] = filters.tenantId;
    }
    
    if (filters.userId) {
      queryOptions.where['userId'] = filters.userId;
    }
    
    if (filters.status) {
      queryOptions.where['status'] = filters.status;
    }
    
    if (filters.channel) {
      queryOptions.where['channels'] = filters.channel;
    }
    
    if (filters.priority) {
      queryOptions.where['priority'] = filters.priority;
    }
    
    if (filters.templateId) {
      queryOptions.where['templateId'] = filters.templateId;
    }

    // Date filters
    if (filters.createdAfter || filters.createdBefore) {
      queryOptions.where['createdAt'] = {};
      
      if (filters.createdAfter) {
        queryOptions.where['createdAt']['gte'] = new Date(filters.createdAfter);
      }
      
      if (filters.createdBefore) {
        queryOptions.where['createdAt']['lte'] = new Date(filters.createdBefore);
      }
    }
    
    if (filters.deliveredAfter || filters.deliveredBefore) {
      queryOptions.where['deliveredAt'] = {};
      
      if (filters.deliveredAfter) {
        queryOptions.where['deliveredAt']['gte'] = new Date(filters.deliveredAfter);
      }
      
      if (filters.deliveredBefore) {
        queryOptions.where['deliveredAt']['lte'] = new Date(filters.deliveredBefore);
      }
    }

    const [items, total] = await this.notificationRepository.findAndCount(queryOptions);
    return { items, total };
  }

  async findOne(id: string, tenantId?: string): Promise<Notification> {
    const queryOptions: FindManyOptions<Notification> = {
      where: { id },
    };

    if (tenantId) {
      queryOptions.where['tenantId'] = tenantId;
    }

    const notification = await this.notificationRepository.findOne(queryOptions);
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    return notification;
  }

  async markAsDelivered(id: string, channel: NotificationChannel): Promise<Notification> {
    const notification = await this.findOne(id);
    
    // Update delivery attempt
    const deliveryAttempts = notification.deliveryAttempts || [];
    deliveryAttempts.push({
      channel,
      timestamp: new Date(),
      success: true,
    });
    
    // Update notification status
    notification.deliveryAttempts = deliveryAttempts;
    notification.deliveredAt = new Date();
    notification.status = NotificationStatus.DELIVERED;
    
    const updatedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Marked notification ${id} as delivered on channel ${channel}`);
    
    // Emit event
    this.eventEmitter.emit('notification.delivered', updatedNotification);
    
    return updatedNotification;
  }

  async markAsFailed(id: string, channel: NotificationChannel, errorMessage: string): Promise<Notification> {
    const notification = await this.findOne(id);
    
    // Update delivery attempt
    const deliveryAttempts = notification.deliveryAttempts || [];
    deliveryAttempts.push({
      channel,
      timestamp: new Date(),
      success: false,
      errorMessage,
    });
    
    // Increment retry count
    notification.deliveryAttempts = deliveryAttempts;
    notification.retryCount += 1;
    
    // Check if max retries reached
    const maxRetries = 3; // This could be configurable per tenant
    
    if (notification.retryCount >= maxRetries) {
      notification.status = NotificationStatus.FAILED;
      this.logger.warn(`Notification ${id} failed after ${maxRetries} attempts`);
    } else {
      notification.status = NotificationStatus.PENDING;
      this.logger.log(`Notification ${id} failed but will be retried (attempt ${notification.retryCount})`);
    }
    
    const updatedNotification = await this.notificationRepository.save(notification);
    
    // Emit event for retry if needed
    if (updatedNotification.status === NotificationStatus.PENDING) {
      // Add delay proportional to retry count
      setTimeout(() => {
        this.eventEmitter.emit('notification.retry', updatedNotification);
      }, notification.retryCount * 60000); // Exponential backoff: 1 min, 2 mins, etc.
    } else {
      this.eventEmitter.emit('notification.failed', updatedNotification);
    }
    
    return updatedNotification;
  }

  async markAsRead(id: string, tenantId?: string): Promise<Notification> {
    const notification = await this.findOne(id, tenantId);
    
    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;
    
    const updatedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Marked notification ${id} as read`);
    
    // Emit event
    this.eventEmitter.emit('notification.read', updatedNotification);
    
    return updatedNotification;
  }

  async cancel(id: string, tenantId?: string): Promise<Notification> {
    const notification = await this.findOne(id, tenantId);
    
    // Only pending or scheduled notifications can be cancelled
    if (notification.status !== NotificationStatus.PENDING && 
        notification.status !== NotificationStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot cancel notification with status ${notification.status}`);
    }
    
    notification.status = NotificationStatus.CANCELED;
    
    const updatedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Cancelled notification ${id}`);
    
    // Emit event
    this.eventEmitter.emit('notification.cancelled', updatedNotification);
    
    return updatedNotification;
  }
}

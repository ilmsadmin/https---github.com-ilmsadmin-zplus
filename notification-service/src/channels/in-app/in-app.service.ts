import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../tenants/tenants.service';
import { InAppNotification } from './entities/in-app-notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InAppService {
  private readonly logger = new Logger(InAppService.name);

  constructor(
    @InjectRepository(InAppNotification)
    private inAppNotificationRepository: Repository<InAppNotification>,
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(options: {
    userId: string;
    title: string;
    body: string;
    link?: string;
    tenantId: string;
    notificationId?: string;
    metadata?: any;
  }): Promise<any> {
    const { userId, title, body, link, tenantId, notificationId, metadata } = options;
    
    try {
      // Create in-app notification
      const inAppNotification = this.inAppNotificationRepository.create({
        userId,
        title,
        body,
        link,
        tenantId,
        notificationId,
        metadata,
        read: false,
      });
      
      // Save to database
      const savedNotification = await this.inAppNotificationRepository.save(inAppNotification);
      
      this.logger.log(`In-app notification created for user ${userId} with ID: ${savedNotification.id}`);
      
      // Emit event for real-time delivery if WebSocket service is available
      this.eventEmitter.emit('in-app.created', {
        tenantId,
        userId,
        notification: savedNotification,
      });
      
      return {
        success: true,
        notificationId: savedNotification.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create in-app notification for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsRead(id: string, userId: string, tenantId: string): Promise<InAppNotification> {
    try {
      const notification = await this.inAppNotificationRepository.findOne({
        where: { id, userId, tenantId },
      });
      
      if (!notification) {
        throw new Error(`In-app notification with ID ${id} not found`);
      }
      
      notification.read = true;
      notification.readAt = new Date();
      
      const updatedNotification = await this.inAppNotificationRepository.save(notification);
      
      this.logger.log(`In-app notification ${id} marked as read by user ${userId}`);
      
      return updatedNotification;
    } catch (error) {
      this.logger.error(`Failed to mark in-app notification ${id} as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    try {
      return this.inAppNotificationRepository.count({
        where: {
          userId,
          tenantId,
          read: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    tenantId: string,
    page = 1,
    limit = 20,
    onlyUnread = false,
  ): Promise<{ items: InAppNotification[]; total: number }> {
    try {
      const queryOptions: any = {
        where: {
          userId,
          tenantId,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      };
      
      if (onlyUnread) {
        queryOptions.where.read = false;
      }
      
      const [items, total] = await this.inAppNotificationRepository.findAndCount(queryOptions);
      
      return { items, total };
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    try {
      const result = await this.inAppNotificationRepository.update(
        {
          userId,
          tenantId,
          read: false,
        },
        {
          read: true,
          readAt: new Date(),
        }
      );
      
      this.logger.log(`Marked ${result.affected} notifications as read for user ${userId}`);
      
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}

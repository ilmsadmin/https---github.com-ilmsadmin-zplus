import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { NotificationStatus } from '../enums/notification-status.enum';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    const now = new Date();
    this.logger.debug(`Processing scheduled notifications at ${now.toISOString()}`);
    
    try {
      // Find all scheduled notifications that are due
      const scheduledNotifications = await this.notificationRepository.find({
        where: {
          status: NotificationStatus.SCHEDULED,
          scheduledFor: LessThan(now),
        },
      });
      
      this.logger.log(`Found ${scheduledNotifications.length} scheduled notifications to process`);
      
      // Process each notification
      for (const notification of scheduledNotifications) {
        // Update status to pending
        notification.status = NotificationStatus.PENDING;
        await this.notificationRepository.save(notification);
        
        // Emit event for processing
        this.eventEmitter.emit('notification.created', notification);
        
        this.logger.debug(`Triggered processing for scheduled notification ${notification.id}`);
      }
    } catch (error) {
      this.logger.error(`Error processing scheduled notifications: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    this.logger.debug('Running notification cleanup job');
    
    try {
      // Define retention period (e.g., 30 days)
      const retentionPeriod = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);
      
      // Find and mark old notifications for deletion or archiving
      const result = await this.notificationRepository.update(
        {
          createdAt: LessThan(cutoffDate),
          status: NotificationStatus.DELIVERED,
        },
        {
          metadata: () => `jsonb_set(metadata, '{archived}', 'true')`,
        }
      );
      
      this.logger.log(`Archived ${result.affected} notifications older than ${retentionPeriod} days`);
    } catch (error) {
      this.logger.error(`Error cleaning up old notifications: ${error.message}`, error.stack);
    }
  }
}

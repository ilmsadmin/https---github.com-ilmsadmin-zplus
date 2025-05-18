import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../../channels/email/email.service';
import { PushService } from '../../channels/push/push.service';
import { SmsService } from '../../channels/sms/sms.service';
import { InAppService } from '../../channels/in-app/in-app.service';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly smsService: SmsService,
    private readonly inAppService: InAppService,
  ) {}

  @OnEvent('notification.created')
  async handleNotificationCreated(notification: Notification) {
    this.logger.log(`Processing notification ${notification.id}`);
    
    try {
      // Mark notification as processing
      notification.status = NotificationStatus.PROCESSING;
      
      // Process each channel in parallel
      const sendPromises = notification.channels.map(channel => 
        this.sendToChannel(notification, channel)
      );
      
      // Wait for all channels to complete
      await Promise.all(sendPromises);
      
      this.logger.log(`Notification ${notification.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing notification ${notification.id}: ${error.message}`, error.stack);
    }
  }

  @OnEvent('notification.retry')
  async handleNotificationRetry(notification: Notification) {
    this.logger.log(`Retrying notification ${notification.id} (attempt ${notification.retryCount})`);
    await this.handleNotificationCreated(notification);
  }

  private async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    this.logger.log(`Sending notification ${notification.id} to channel ${channel}`);
    
    try {
      let success = false;
      
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (notification.userEmail) {
            await this.emailService.send({
              to: notification.userEmail,
              subject: notification.subject,
              text: notification.content,
              html: notification.content, // Assuming content is HTML
              tenantId: notification.tenantId,
              metadata: notification.metadata,
            });
            success = true;
          } else {
            throw new Error('Missing user email for EMAIL channel');
          }
          break;
          
        case NotificationChannel.PUSH:
          if (notification.userDeviceToken) {
            await this.pushService.send({
              deviceToken: notification.userDeviceToken,
              title: notification.subject,
              body: notification.content,
              tenantId: notification.tenantId,
              metadata: notification.metadata,
            });
            success = true;
          } else {
            throw new Error('Missing device token for PUSH channel');
          }
          break;
          
        case NotificationChannel.SMS:
          if (notification.userPhone) {
            await this.smsService.send({
              to: notification.userPhone,
              body: notification.content,
              tenantId: notification.tenantId,
              metadata: notification.metadata,
            });
            success = true;
          } else {
            throw new Error('Missing phone number for SMS channel');
          }
          break;
          
        case NotificationChannel.IN_APP:
          if (notification.userId) {
            await this.inAppService.send({
              userId: notification.userId,
              title: notification.subject,
              body: notification.content,
              tenantId: notification.tenantId,
              metadata: notification.metadata,
            });
            success = true;
          } else {
            throw new Error('Missing userId for IN_APP channel');
          }
          break;
          
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
      
      if (success) {
        await this.notificationsService.markAsDelivered(notification.id, channel);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id} to channel ${channel}: ${error.message}`);
      await this.notificationsService.markAsFailed(notification.id, channel, error.message);
    }
  }
}

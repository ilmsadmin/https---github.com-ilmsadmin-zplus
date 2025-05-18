/**
 * Kafka service for the notification-service
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { 
  NestKafkaService, 
  NotificationEventType,
  BaseEvent,
  Event
} from '@multi-tenant/event-bus';
import { v4 as uuidv4 } from 'uuid';

// Notification event data interfaces
export interface EmailRequestedEventData {
  id: string;
  tenantId: string;
  recipient: string;
  templateId: string;
  templateData: any;
  subject: string;
  priority: 'high' | 'normal' | 'low';
}

export interface EmailSentEventData {
  id: string;
  requestId: string;
  tenantId: string;
  recipient: string;
  sentAt: string;
  messageId: string;
}

export interface EmailFailedEventData {
  id: string;
  requestId: string;
  tenantId: string;
  recipient: string;
  failedAt: string;
  reason: string;
  retryCount: number;
  willRetry: boolean;
}

export interface InAppNotificationCreatedEventData {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  expiresAt?: string;
}

export interface InAppNotificationReadEventData {
  id: string;
  tenantId: string;
  userId: string;
  notificationId: string;
  readAt: string;
}

@Injectable()
export class NotificationKafkaService implements OnModuleInit {
  private readonly logger = new Logger(NotificationKafkaService.name);
  private readonly NOTIFICATION_EVENTS_TOPIC = 'notification.events';

  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    // This service doesn't need to subscribe to events on init
    // The specific consumers will handle the subscriptions
  }

  /**
   * Publish an email requested event
   */
  async publishEmailRequested(data: EmailRequestedEventData): Promise<void> {
    const event: Event<EmailRequestedEventData> = {
      id: uuidv4(),
      type: NotificationEventType.EMAIL_REQUESTED,
      source: 'notification-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.tenantId,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.NOTIFICATION_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published notification.email_requested event for ${data.recipient}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.email_requested event for ${data.recipient}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish an email sent event
   */
  async publishEmailSent(data: EmailSentEventData): Promise<void> {
    const event: Event<EmailSentEventData> = {
      id: uuidv4(),
      type: NotificationEventType.EMAIL_SENT,
      source: 'notification-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.tenantId,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.NOTIFICATION_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published notification.email_sent event for ${data.recipient}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.email_sent event for ${data.recipient}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish an email failed event
   */
  async publishEmailFailed(data: EmailFailedEventData): Promise<void> {
    const event: Event<EmailFailedEventData> = {
      id: uuidv4(),
      type: NotificationEventType.EMAIL_FAILED,
      source: 'notification-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.tenantId,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.NOTIFICATION_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published notification.email_failed event for ${data.recipient}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.email_failed event for ${data.recipient}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish an in-app notification created event
   */
  async publishInAppNotificationCreated(data: InAppNotificationCreatedEventData): Promise<void> {
    const event: Event<InAppNotificationCreatedEventData> = {
      id: uuidv4(),
      type: NotificationEventType.IN_APP_NOTIFICATION_CREATED,
      source: 'notification-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.tenantId,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.NOTIFICATION_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published notification.in_app_created event for user ${data.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.in_app_created event for user ${data.userId}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish an in-app notification read event
   */
  async publishInAppNotificationRead(data: InAppNotificationReadEventData): Promise<void> {
    const event: Event<InAppNotificationReadEventData> = {
      id: uuidv4(),
      type: NotificationEventType.IN_APP_NOTIFICATION_READ,
      source: 'notification-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.tenantId,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.NOTIFICATION_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published notification.in_app_read event for user ${data.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish notification.in_app_read event for user ${data.userId}`,
        error.stack
      );
      throw error;
    }
  }
}

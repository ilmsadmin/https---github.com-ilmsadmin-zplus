/**
 * Consumer for user events to trigger notifications
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NestKafkaService, Event, UserEventType } from '@multi-tenant/event-bus';

@Injectable()
export class UserEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    // Subscribe to user events that require notifications
    await this.kafkaService.subscribe<Event<any>>(
      'user.events',
      async (message, event) => {
        this.logger.debug(`Processing user event: ${event.type}`);
        
        try {
          switch (event.type) {
            case UserEventType.CREATED:
              await this.handleUserCreated(event);
              break;
              
            case UserEventType.PASSWORD_CHANGED:
              await this.handlePasswordChanged(event);
              break;
              
            case UserEventType.MFA_ENABLED:
              await this.handleMfaEnabled(event);
              break;
              
            case UserEventType.LOCKED:
              await this.handleUserLocked(event);
              break;
          }
        } catch (error) {
          this.logger.error(`Error processing user event ${event.type}`, error);
          throw error; // Rethrow to trigger retry/DLQ logic
        }
      },
      { groupId: 'notification-service-user-consumer' }
    );
    
    this.logger.log('Subscribed to user events');
  }

  /**
   * Handle user.created event
   */
  private async handleUserCreated(event: Event<any>) {
    this.logger.log(`Processing user.created event for user ${event.data.id} in tenant ${event.tenantId}`);
    
    // Logic to send welcome email to new user
    // For example:
    // await this.notificationService.sendUserWelcomeEmail({
    //   tenantId: event.tenantId,
    //   userId: event.data.id,
    //   email: event.data.email,
    //   firstName: event.data.firstName,
    //   lastName: event.data.lastName
    // });
  }

  /**
   * Handle user.password_changed event
   */
  private async handlePasswordChanged(event: Event<any>) {
    this.logger.log(`Processing user.password_changed event for user ${event.data.userId} in tenant ${event.tenantId}`);
    
    // Logic to send password change notification
    // For example:
    // await this.notificationService.sendPasswordChangedEmail({
    //   tenantId: event.tenantId,
    //   userId: event.data.userId,
    //   email: event.data.email,
    //   changedAt: event.data.changedAt,
    //   ipAddress: event.data.ipAddress,
    //   userAgent: event.data.userAgent
    // });
  }

  /**
   * Handle user.mfa_enabled event
   */
  private async handleMfaEnabled(event: Event<any>) {
    this.logger.log(`Processing user.mfa_enabled event for user ${event.data.userId} in tenant ${event.tenantId}`);
    
    // Logic to send MFA enabled notification
    // For example:
    // await this.notificationService.sendMfaEnabledEmail({
    //   tenantId: event.tenantId,
    //   userId: event.data.userId,
    //   email: event.data.email,
    //   enabledAt: event.data.enabledAt,
    //   method: event.data.method
    // });
  }

  /**
   * Handle user.locked event
   */
  private async handleUserLocked(event: Event<any>) {
    this.logger.log(`Processing user.locked event for user ${event.data.userId} in tenant ${event.tenantId}`);
    
    // Logic to send account locked notification
    // For example:
    // await this.notificationService.sendAccountLockedEmail({
    //   tenantId: event.tenantId,
    //   userId: event.data.userId,
    //   email: event.data.email,
    //   lockedAt: event.data.lockedAt,
    //   reason: event.data.reason,
    //   unlockInstructions: await this.userService.getUnlockInstructions(event.tenantId)
    // });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('user.created')
  async handleUserCreated(payload: any) {
    this.logger.log(`Received user.created event for user ID: ${payload.userId}`);
    
    try {
      // Create welcome notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userEmail: payload.email,
        templateCode: 'welcome-email',
        subject: 'Welcome to our platform',
        content: `Welcome to our platform, ${payload.name}!`,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL,
        variables: {
          userName: payload.name,
          userEmail: payload.email,
          activationLink: payload.activationLink,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating welcome notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('user.passwordReset')
  async handlePasswordReset(payload: any) {
    this.logger.log(`Received user.passwordReset event for user ID: ${payload.userId}`);
    
    try {
      // Create password reset notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userEmail: payload.email,
        templateCode: 'password-reset',
        subject: 'Password Reset Request',
        content: 'You have requested to reset your password.',
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH,
        variables: {
          userName: payload.name,
          resetLink: payload.resetLink,
          expirationTime: payload.expirationTime,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating password reset notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: any) {
    this.logger.log(`Received order.created event for order ID: ${payload.orderId}`);
    
    try {
      // Create order confirmation notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userEmail: payload.email,
        templateCode: 'order-confirmation',
        subject: `Order Confirmation #${payload.orderNumber}`,
        content: `Your order #${payload.orderNumber} has been confirmed.`,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SMS],
        priority: NotificationPriority.NORMAL,
        variables: {
          userName: payload.userName,
          orderNumber: payload.orderNumber,
          orderItems: payload.items,
          orderTotal: payload.total,
          orderDate: payload.date,
          shippingAddress: payload.shippingAddress,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating order confirmation notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(payload: any) {
    this.logger.log(`Received payment.failed event for payment ID: ${payload.paymentId}`);
    
    try {
      // Create payment failure notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userEmail: payload.email,
        templateCode: 'payment-failed',
        subject: 'Payment Failed',
        content: 'Your payment has failed.',
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority: NotificationPriority.HIGH,
        variables: {
          userName: payload.userName,
          paymentAmount: payload.amount,
          paymentMethod: payload.method,
          failureReason: payload.reason,
          retryLink: payload.retryLink,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating payment failure notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('subscription.expiring')
  async handleSubscriptionExpiring(payload: any) {
    this.logger.log(`Received subscription.expiring event for subscription ID: ${payload.subscriptionId}`);
    
    try {
      // Create subscription expiration notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.userId,
        userEmail: payload.email,
        templateCode: 'subscription-expiring',
        subject: 'Your Subscription is Expiring Soon',
        content: 'Your subscription is expiring soon.',
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL,
        variables: {
          userName: payload.userName,
          subscriptionPlan: payload.planName,
          expirationDate: payload.expirationDate,
          renewalLink: payload.renewalLink,
          daysRemaining: payload.daysRemaining,
        },
        scheduledFor: new Date(Date.now() + 86400000), // Send 1 day before expiry
      });
    } catch (error) {
      this.logger.error(`Error creating subscription expiration notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('tenant.created')
  async handleTenantCreated(payload: any) {
    this.logger.log(`Received tenant.created event for tenant ID: ${payload.tenantId}`);
    
    try {
      // Create tenant welcome notification
      await this.notificationsService.create({
        tenantId: payload.tenantId,
        userId: payload.adminUserId,
        userEmail: payload.adminEmail,
        templateCode: 'tenant-welcome',
        subject: 'Welcome to Our Multi-Tenant Platform',
        content: `Your tenant ${payload.tenantName} has been created successfully.`,
        channels: [NotificationChannel.EMAIL],
        priority: NotificationPriority.HIGH,
        variables: {
          tenantName: payload.tenantName,
          tenantCode: payload.tenantCode,
          adminName: payload.adminName,
          adminEmail: payload.adminEmail,
          setupGuideLink: payload.setupGuideLink,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating tenant welcome notification: ${error.message}`, error.stack);
    }
  }
}

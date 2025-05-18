import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    private invoicesService: InvoicesService,
    private paymentsService: PaymentsService,
    private subscriptionsService: SubscriptionsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('payment.succeeded')
  async handlePaymentSucceeded(payload: any) {
    this.logger.log(`Payment succeeded: ${JSON.stringify(payload)}`);
    
    try {
      // Update payment status
      const payment = await this.paymentsService.findByExternalId(payload.id);
      if (payment) {
        await this.paymentsService.updateStatus(payment.id, PaymentStatus.SUCCEEDED);
        
        // Mark invoice as paid
        if (payment.invoiceId) {
          await this.invoicesService.markAsPaid(payment.invoiceId);
        }
        
        // Emit event for notifications
        this.eventEmitter.emit('payment.success.notification', {
          tenantId: payment.tenantId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          invoiceId: payment.invoiceId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process payment succeeded event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(payload: any) {
    this.logger.log(`Payment failed: ${JSON.stringify(payload)}`);
    
    try {
      // Update payment status
      const payment = await this.paymentsService.findByExternalId(payload.id);
      if (payment) {
        await this.paymentsService.updateStatus(payment.id, PaymentStatus.FAILED);
        
        // Emit event for notifications
        this.eventEmitter.emit('payment.failed.notification', {
          tenantId: payment.tenantId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          invoiceId: payment.invoiceId,
          failureReason: payload.failureReason || 'Unknown error',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process payment failed event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('subscription.updated')
  async handleSubscriptionUpdated(payload: any) {
    this.logger.log(`Subscription updated: ${JSON.stringify(payload)}`);
    
    try {
      const subscription = await this.subscriptionsService.findByExternalId(payload.id);
      
      if (subscription) {
        // Update subscription status based on external state
        let status: SubscriptionStatus;
        
        switch (payload.status) {
          case 'active':
            status = SubscriptionStatus.ACTIVE;
            break;
          case 'past_due':
            status = SubscriptionStatus.PAST_DUE;
            break;
          case 'canceled':
            status = SubscriptionStatus.CANCELED;
            break;
          case 'unpaid':
            status = SubscriptionStatus.PAST_DUE;
            break;
          case 'trialing':
            status = SubscriptionStatus.TRIAL;
            break;
          default:
            this.logger.warn(`Unknown subscription status from provider: ${payload.status}`);
            return;
        }
        
        await this.subscriptionsService.update(subscription.id, { status });
        
        // Emit event for notifications
        this.eventEmitter.emit('subscription.updated.notification', {
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          status: status,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process subscription updated event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('subscription.canceled')
  async handleSubscriptionCanceled(payload: any) {
    this.logger.log(`Subscription canceled: ${JSON.stringify(payload)}`);
    
    try {
      const subscription = await this.subscriptionsService.findByExternalId(payload.id);
      
      if (subscription) {
        // Update subscription as canceled
        await this.subscriptionsService.cancel(subscription.id, false);
        
        // Emit event for notifications
        this.eventEmitter.emit('subscription.canceled.notification', {
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          planId: subscription.planId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process subscription canceled event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('invoice.payment_succeeded')
  async handleInvoicePaymentSucceeded(payload: any) {
    this.logger.log(`Invoice payment succeeded: ${JSON.stringify(payload)}`);
    
    try {
      // Find invoice by external ID
      const invoice = await this.invoicesService.findByExternalId(payload.id);
      
      if (invoice) {
        // Mark invoice as paid
        await this.invoicesService.markAsPaid(invoice.id);
        
        // Emit event for notifications
        this.eventEmitter.emit('invoice.paid.notification', {
          tenantId: invoice.tenantId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process invoice payment succeeded event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('invoice.payment_failed')
  async handleInvoicePaymentFailed(payload: any) {
    this.logger.log(`Invoice payment failed: ${JSON.stringify(payload)}`);
    
    try {
      // Find invoice by external ID
      const invoice = await this.invoicesService.findByExternalId(payload.id);
      
      if (invoice) {
        // Update subscription if it's associated with this invoice
        const subscription = await this.subscriptionsService.findOne(invoice.subscriptionId);
        if (subscription && subscription.status === SubscriptionStatus.ACTIVE) {
          await this.subscriptionsService.update(subscription.id, { status: SubscriptionStatus.PAST_DUE });
        }
        
        // Emit event for notifications
        this.eventEmitter.emit('invoice.payment_failed.notification', {
          tenantId: invoice.tenantId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          failureReason: payload.failureReason || 'Unknown error',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process invoice payment failed event: ${error.message}`, error.stack);
    }
  }
}

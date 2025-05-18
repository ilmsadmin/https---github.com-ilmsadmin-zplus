/**
 * Consumer for billing events to trigger notifications
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NestKafkaService, Event, BillingEventType } from '@multi-tenant/event-bus';

@Injectable()
export class BillingEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(BillingEventsConsumer.name);

  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    // Subscribe to billing events that require notifications
    await this.kafkaService.subscribe<Event<any>>(
      'billing.events',
      async (message, event) => {
        this.logger.debug(`Processing billing event: ${event.type}`);
        
        try {
          switch (event.type) {
            case BillingEventType.INVOICE_CREATED:
              await this.handleInvoiceCreated(event);
              break;
              
            case BillingEventType.PAYMENT_SUCCEEDED:
              await this.handlePaymentSucceeded(event);
              break;
              
            case BillingEventType.PAYMENT_FAILED:
              await this.handlePaymentFailed(event);
              break;
              
            case BillingEventType.SUBSCRIPTION_RENEWED:
              await this.handleSubscriptionRenewed(event);
              break;
              
            case BillingEventType.SUBSCRIPTION_CANCELLED:
              await this.handleSubscriptionCancelled(event);
              break;
          }
        } catch (error) {
          this.logger.error(`Error processing billing event ${event.type}`, error);
          throw error; // Rethrow to trigger retry/DLQ logic
        }
      },
      { groupId: 'notification-service-billing-consumer' }
    );
    
    this.logger.log('Subscribed to billing events');
  }

  /**
   * Handle billing.invoice_created event
   */
  private async handleInvoiceCreated(event: Event<any>) {
    this.logger.log(`Processing billing.invoice_created event for tenant ${event.tenantId}`);
    
    // Logic to send invoice notification
    // For example:
    // await this.notificationService.sendInvoiceCreatedEmail({
    //   tenantId: event.tenantId,
    //   email: event.data.billingEmail,
    //   invoiceNumber: event.data.invoiceNumber,
    //   amount: event.data.amount,
    //   currency: event.data.currency,
    //   dueDate: event.data.dueDate,
    //   invoiceUrl: event.data.invoiceUrl
    // });
  }

  /**
   * Handle billing.payment_succeeded event
   */
  private async handlePaymentSucceeded(event: Event<any>) {
    this.logger.log(`Processing billing.payment_succeeded event for tenant ${event.tenantId}`);
    
    // Logic to send payment confirmation
    // For example:
    // await this.notificationService.sendPaymentSucceededEmail({
    //   tenantId: event.tenantId,
    //   email: event.data.billingEmail,
    //   invoiceNumber: event.data.invoiceNumber,
    //   amount: event.data.amount,
    //   currency: event.data.currency,
    //   paymentMethod: event.data.paymentMethod,
    //   paidAt: event.data.paidAt,
    //   receiptUrl: event.data.receiptUrl
    // });
  }

  /**
   * Handle billing.payment_failed event
   */
  private async handlePaymentFailed(event: Event<any>) {
    this.logger.log(`Processing billing.payment_failed event for tenant ${event.tenantId}`);
    
    // Logic to send payment failure notification
    // For example:
    // await this.notificationService.sendPaymentFailedEmail({
    //   tenantId: event.tenantId,
    //   email: event.data.billingEmail,
    //   invoiceNumber: event.data.invoiceNumber,
    //   amount: event.data.amount,
    //   currency: event.data.currency,
    //   failedAt: event.data.failedAt,
    //   reason: event.data.reason,
    //   retryUrl: event.data.retryUrl
    // });
  }

  /**
   * Handle billing.subscription_renewed event
   */
  private async handleSubscriptionRenewed(event: Event<any>) {
    this.logger.log(`Processing billing.subscription_renewed event for tenant ${event.tenantId}`);
    
    // Logic to send subscription renewal confirmation
    // For example:
    // await this.notificationService.sendSubscriptionRenewedEmail({
    //   tenantId: event.tenantId,
    //   email: event.data.billingEmail,
    //   packageName: event.data.packageName,
    //   renewalDate: event.data.renewalDate,
    //   nextBillingDate: event.data.nextBillingDate,
    //   amount: event.data.amount,
    //   currency: event.data.currency
    // });
  }

  /**
   * Handle billing.subscription_cancelled event
   */
  private async handleSubscriptionCancelled(event: Event<any>) {
    this.logger.log(`Processing billing.subscription_cancelled event for tenant ${event.tenantId}`);
    
    // Logic to send subscription cancellation notification
    // For example:
    // await this.notificationService.sendSubscriptionCancelledEmail({
    //   tenantId: event.tenantId,
    //   email: event.data.billingEmail,
    //   packageName: event.data.packageName,
    //   cancellationDate: event.data.cancellationDate,
    //   effectiveEndDate: event.data.effectiveEndDate,
    //   reason: event.data.reason
    // });
  }
}

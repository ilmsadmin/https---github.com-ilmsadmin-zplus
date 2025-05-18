import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BasePaymentProvider } from './base-payment.provider';

@Injectable()
export class StripeProvider extends BasePaymentProvider {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeProvider.name);

  constructor(private configService: ConfigService) {
    super();
    this.stripe = new Stripe(this.configService.get<string>('payments.stripe.secretKey', ''), {
      apiVersion: this.configService.get<string>('payments.stripe.apiVersion', '2023-10-16'),
    });
  }

  async createPaymentMethod(customerId: string, data: any): Promise<any> {
    try {
      // Attach the payment method to the customer
      const paymentMethod = await this.stripe.paymentMethods.attach(
        data.paymentMethodId,
        { customer: customerId }
      );

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: data.paymentMethodId },
      });

      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to create payment method: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createCustomer(data: any): Promise<any> {
    try {
      return await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: { tenantId: data.tenantId, ...data.metadata },
        address: data.address,
        description: `Customer for tenant ${data.tenantId}`,
      });
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCustomer(customerId: string, data: any): Promise<any> {
    try {
      return await this.stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        metadata: data.metadata,
        address: data.address,
      });
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processPayment(amount: number, currency: string, paymentMethodId: string, metadata: any): Promise<any> {
    try {
      return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createSubscription(customerId: string, planId: string, metadata: any): Promise<any> {
    try {
      return await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, data: any): Promise<any> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, data);
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<any> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: atPeriodEnd,
      });
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async issueRefund(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Stripe requires amount in cents
      }

      return await this.stripe.refunds.create(refundData);
    } catch (error) {
      this.logger.error(`Failed to issue refund: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateWebhookEvent(payload: any, signature: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('payments.stripe.webhookSecret');
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return !!event;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async processWebhookEvent(payload: any): Promise<any> {
    try {
      // Convert the payload to a Stripe event
      const event = JSON.parse(payload);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object);
        case 'invoice.payment_succeeded':
          return this.handleInvoicePaymentSucceeded(event.data.object);
        case 'invoice.payment_failed':
          return this.handleInvoicePaymentFailed(event.data.object);
        case 'customer.subscription.updated':
          return this.handleSubscriptionUpdated(event.data.object);
        case 'customer.subscription.deleted':
          return this.handleSubscriptionDeleted(event.data.object);
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return { status: 'ignored', eventType: event.type };
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods for webhook event processing
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<any> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    return { status: 'success', paymentIntentId: paymentIntent.id };
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<any> {
    this.logger.log(`Payment failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
    return { 
      status: 'failed', 
      paymentIntentId: paymentIntent.id,
      errorMessage: paymentIntent.last_payment_error?.message || 'Unknown error'
    };
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<any> {
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    return { status: 'success', invoiceId: invoice.id };
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<any> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    return { status: 'failed', invoiceId: invoice.id };
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<any> {
    this.logger.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
    return { status: 'updated', subscriptionId: subscription.id, subscriptionStatus: subscription.status };
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<any> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    return { status: 'deleted', subscriptionId: subscription.id };
  }
}

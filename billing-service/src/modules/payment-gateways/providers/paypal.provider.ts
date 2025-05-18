import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BasePaymentProvider } from './base-payment.provider';

@Injectable()
export class PayPalProvider extends BasePaymentProvider {
  private readonly logger = new Logger(PayPalProvider.name);
  private readonly baseUrl: string;
  private accessToken: string;
  private tokenExpiry: Date;

  constructor(private configService: ConfigService) {
    super();
    const environment = this.configService.get<string>('payments.paypal.environment', 'sandbox');
    this.baseUrl = environment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const clientId = this.configService.get<string>('payments.paypal.clientId');
      const clientSecret = this.configService.get<string>('payments.paypal.clientSecret');

      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/oauth2/token`,
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
        data: 'grant_type=client_credentials',
      });

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 5 minutes to be safe)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 300000);
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Failed to get PayPal access token: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`PayPal API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createPaymentMethod(customerId: string, data: any): Promise<any> {
    // PayPal doesn't have an exact equivalent of "payment methods"
    // Instead we return the provided data as PayPal handles this differently
    this.logger.log(`PayPal doesn't store payment methods like Stripe. Customer ID: ${customerId}`);
    return { success: true, customerId, paymentSource: data.paymentSource };
  }

  async createCustomer(data: any): Promise<any> {
    // PayPal doesn't have a direct "customers" API
    // We'll create a minimal representation for our system
    this.logger.log(`Creating PayPal customer representation for: ${data.email}`);
    return {
      id: `PAYPAL_CUSTOMER_${Date.now()}`,
      email: data.email,
      name: data.name,
      metadata: { tenantId: data.tenantId, ...data.metadata },
    };
  }

  async updateCustomer(customerId: string, data: any): Promise<any> {
    // Since PayPal doesn't have a direct customer API, we just log and return success
    this.logger.log(`Updating PayPal customer representation: ${customerId}`);
    return {
      id: customerId,
      ...data,
      updated: true,
    };
  }

  async processPayment(amount: number, currency: string, paymentMethodId: string, metadata: any): Promise<any> {
    try {
      // Create a PayPal order
      const order = await this.makeRequest('post', '/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          description: metadata.description || 'Payment',
          custom_id: metadata.invoiceId || '',
        }],
        application_context: {
          brand_name: metadata.brandName || 'Multi-Tenant Platform',
          return_url: metadata.returnUrl || 'https://example.com/success',
          cancel_url: metadata.cancelUrl || 'https://example.com/cancel',
        },
      });

      return order;
    } catch (error) {
      this.logger.error(`Failed to process PayPal payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async capturePayment(orderId: string): Promise<any> {
    try {
      return await this.makeRequest('post', `/v2/checkout/orders/${orderId}/capture`);
    } catch (error) {
      this.logger.error(`Failed to capture PayPal payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createSubscription(customerId: string, planId: string, metadata: any): Promise<any> {
    try {
      return await this.makeRequest('post', '/v1/billing/subscriptions', {
        plan_id: planId,
        subscriber: {
          name: {
            given_name: metadata.firstName || '',
            surname: metadata.lastName || '',
          },
          email_address: metadata.email,
        },
        application_context: {
          brand_name: metadata.brandName || 'Multi-Tenant Platform',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: metadata.returnUrl || 'https://example.com/subscription/success',
          cancel_url: metadata.cancelUrl || 'https://example.com/subscription/cancel',
        },
        custom_id: metadata.tenantId || '',
      });
    } catch (error) {
      this.logger.error(`Failed to create PayPal subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, data: any): Promise<any> {
    try {
      return await this.makeRequest('patch', `/v1/billing/subscriptions/${subscriptionId}`, data);
    } catch (error) {
      this.logger.error(`Failed to update PayPal subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<any> {
    try {
      return await this.makeRequest('post', `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        reason: 'Canceled by customer',
      });
    } catch (error) {
      this.logger.error(`Failed to cancel PayPal subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async issueRefund(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundData: any = {
        amount: {},
        invoice_id: paymentId,
        note_to_payer: 'Refund for payment',
      };

      if (amount) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: 'USD', // Default to USD, should be dynamic in a real implementation
        };
      }

      return await this.makeRequest('post', `/v2/payments/captures/${paymentId}/refund`, refundData);
    } catch (error) {
      this.logger.error(`Failed to issue PayPal refund: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateWebhookEvent(payload: any, signature: string): Promise<boolean> {
    // In a real implementation, you would verify the webhook signature
    // For now, we'll just log and return true
    this.logger.log(`PayPal webhook received. Signature validation would happen here`);
    return true;
  }

  async processWebhookEvent(payload: any): Promise<any> {
    try {
      const event = JSON.parse(payload);
      const eventType = event?.event_type;

      this.logger.log(`Processing PayPal webhook event: ${eventType}`);

      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          return this.handlePaymentCaptureCompleted(event.resource);
        case 'PAYMENT.CAPTURE.DENIED':
          return this.handlePaymentCaptureDenied(event.resource);
        case 'PAYMENT.CAPTURE.REFUNDED':
          return this.handlePaymentCaptureRefunded(event.resource);
        case 'BILLING.SUBSCRIPTION.CREATED':
          return this.handleSubscriptionCreated(event.resource);
        case 'BILLING.SUBSCRIPTION.UPDATED':
          return this.handleSubscriptionUpdated(event.resource);
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          return this.handleSubscriptionCancelled(event.resource);
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          return this.handleSubscriptionPaymentFailed(event.resource);
        default:
          this.logger.log(`Unhandled PayPal event type: ${eventType}`);
          return { status: 'ignored', eventType };
      }
    } catch (error) {
      this.logger.error(`Error processing PayPal webhook event: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods for webhook event processing
  private async handlePaymentCaptureCompleted(resource: any): Promise<any> {
    this.logger.log(`Payment capture completed: ${resource.id}`);
    return { status: 'success', paymentId: resource.id };
  }

  private async handlePaymentCaptureDenied(resource: any): Promise<any> {
    this.logger.log(`Payment capture denied: ${resource.id}`);
    return { status: 'failed', paymentId: resource.id };
  }

  private async handlePaymentCaptureRefunded(resource: any): Promise<any> {
    this.logger.log(`Payment refunded: ${resource.id}`);
    return { status: 'refunded', paymentId: resource.id };
  }

  private async handleSubscriptionCreated(resource: any): Promise<any> {
    this.logger.log(`Subscription created: ${resource.id}`);
    return { status: 'created', subscriptionId: resource.id };
  }

  private async handleSubscriptionUpdated(resource: any): Promise<any> {
    this.logger.log(`Subscription updated: ${resource.id}`);
    return { status: 'updated', subscriptionId: resource.id };
  }

  private async handleSubscriptionCancelled(resource: any): Promise<any> {
    this.logger.log(`Subscription cancelled: ${resource.id}`);
    return { status: 'cancelled', subscriptionId: resource.id };
  }

  private async handleSubscriptionPaymentFailed(resource: any): Promise<any> {
    this.logger.log(`Subscription payment failed: ${resource.id}`);
    return { status: 'failed', subscriptionId: resource.id };
  }
}

import { IPaymentProvider } from '../../common/interfaces/payment-provider.interface';

export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract createPaymentMethod(customerId: string, data: any): Promise<any>;
  abstract createCustomer(data: any): Promise<any>;
  abstract updateCustomer(customerId: string, data: any): Promise<any>;
  abstract processPayment(amount: number, currency: string, paymentMethodId: string, metadata: any): Promise<any>;
  abstract createSubscription(customerId: string, planId: string, metadata: any): Promise<any>;
  abstract updateSubscription(subscriptionId: string, data: any): Promise<any>;
  abstract cancelSubscription(subscriptionId: string, atPeriodEnd?: boolean): Promise<any>;
  abstract issueRefund(paymentId: string, amount?: number): Promise<any>;
  abstract validateWebhookEvent(payload: any, signature: string): Promise<boolean>;
  abstract processWebhookEvent(payload: any): Promise<any>;
}

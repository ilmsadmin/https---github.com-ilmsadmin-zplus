/**
 * Payment Provider Interface
 * This interface defines the contract that all payment gateway implementations must follow
 */
export interface IPaymentProvider {
  /**
   * Creates a payment method (card, bank account, etc.)
   */
  createPaymentMethod(customerId: string, data: any): Promise<any>;

  /**
   * Creates a customer in the payment gateway
   */
  createCustomer(data: any): Promise<any>;

  /**
   * Updates a customer in the payment gateway
   */
  updateCustomer(customerId: string, data: any): Promise<any>;

  /**
   * Processes a payment
   */
  processPayment(amount: number, currency: string, paymentMethodId: string, metadata: any): Promise<any>;

  /**
   * Creates a subscription in the payment gateway
   */
  createSubscription(customerId: string, planId: string, metadata: any): Promise<any>;

  /**
   * Updates a subscription in the payment gateway
   */
  updateSubscription(subscriptionId: string, data: any): Promise<any>;

  /**
   * Cancels a subscription in the payment gateway
   */
  cancelSubscription(subscriptionId: string, atPeriodEnd?: boolean): Promise<any>;

  /**
   * Issues a refund for a payment
   */
  issueRefund(paymentId: string, amount?: number): Promise<any>;

  /**
   * Validates a webhook event
   */
  validateWebhookEvent(payload: any, signature: string): Promise<boolean>;

  /**
   * Process webhook events from the payment gateway
   */
  processWebhookEvent(payload: any): Promise<any>;
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider } from '../../common/interfaces/payment-provider.interface';
import { StripeProvider } from './providers/stripe.provider';
import { PayPalProvider } from './providers/paypal.provider';

@Injectable()
export class PaymentGatewaysService {
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize payment providers
    this.registerProviders();
  }

  private registerProviders(): void {
    // Register Stripe provider
    const stripeSecretKey = this.configService.get<string>('payments.stripe.secretKey');
    const stripeWebhookSecret = this.configService.get<string>('payments.stripe.webhookSecret');
    
    if (stripeSecretKey) {
      this.providers.set('stripe', new StripeProvider(stripeSecretKey, stripeWebhookSecret));
    }
    
    // Register PayPal provider
    const paypalClientId = this.configService.get<string>('payments.paypal.clientId');
    const paypalClientSecret = this.configService.get<string>('payments.paypal.clientSecret');
    const paypalEnvironment = this.configService.get<string>('payments.paypal.environment');
    
    if (paypalClientId && paypalClientSecret) {
      this.providers.set('paypal', new PayPalProvider(paypalClientId, paypalClientSecret, paypalEnvironment));
    }
    
    // Additional providers can be registered here
  }

  getProvider(providerName: string): IPaymentProvider {
    const provider = this.providers.get(providerName.toLowerCase());
    
    if (!provider) {
      throw new NotFoundException(`Payment provider "${providerName}" not found`);
    }
    
    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async processWebhook(providerName: string, payload: any, signature: string): Promise<any> {
    const provider = this.getProvider(providerName);
    
    // Verify and process webhook payload
    return provider.handleWebhook(payload, signature);
  }

  // Helper method to create a customer across all payment gateways
  async createCustomerAcrossGateways(customerData: any): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    for (const [providerName, provider] of this.providers.entries()) {
      try {
        const customer = await provider.createCustomer(customerData);
        results.set(providerName, customer);
      } catch (error) {
        console.error(`Failed to create customer in ${providerName}:`, error);
        results.set(providerName, { error: error.message });
      }
    }
    
    return results;
  }
}

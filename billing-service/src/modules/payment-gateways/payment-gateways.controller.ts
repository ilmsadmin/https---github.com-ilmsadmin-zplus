import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentGatewaysService } from './payment-gateways.service';
import { Request } from 'express';

@ApiTags('payment-gateways')
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Handle payment gateway webhook' })
  @ApiParam({ name: 'provider', description: 'Payment provider name (stripe, paypal, etc.)' })
  @ApiBody({ description: 'Webhook payload from the payment provider' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('paypal-transmission-id') paypalTransmissionId?: string,
    @Headers('paypal-transmission-sig') paypalTransmissionSig?: string,
    @Headers('paypal-cert-url') paypalCertUrl?: string,
  ): Promise<any> {
    let signature: string;
    
    // Determine the signature based on the provider
    switch (provider.toLowerCase()) {
      case 'stripe':
        signature = stripeSignature;
        break;
      case 'paypal':
        // PayPal uses multiple headers for its signature verification
        signature = JSON.stringify({
          transmissionId: paypalTransmissionId,
          transmissionSig: paypalTransmissionSig,
          certUrl: paypalCertUrl,
        });
        break;
      default:
        signature = '';
    }
    
    // Use the raw body for webhook signature verification
    const payload = req.rawBody || req.body;
    
    return this.paymentGatewaysService.processWebhook(provider, payload, signature);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create a customer across all payment gateways' })
  @ApiBody({ description: 'Customer data to create in payment gateways' })
  @ApiResponse({ status: 201, description: 'Customer created in payment gateways' })
  async createCustomer(@Body() customerData: any): Promise<any> {
    const results = await this.paymentGatewaysService.createCustomerAcrossGateways(customerData);
    return Object.fromEntries(results);
  }

  @Post('payment-methods/:provider')
  @ApiOperation({ summary: 'Create a payment method with a specific provider' })
  @ApiParam({ name: 'provider', description: 'Payment provider name (stripe, paypal, etc.)' })
  @ApiBody({ description: 'Payment method data' })
  @ApiResponse({ status: 201, description: 'Payment method created' })
  async createPaymentMethod(
    @Param('provider') provider: string,
    @Body() data: any,
  ): Promise<any> {
    const paymentProvider = this.paymentGatewaysService.getProvider(provider);
    return paymentProvider.createPaymentMethod(data.customerId, data);
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { StripeProvider } from './providers/stripe.provider';
import { PayPalProvider } from './providers/paypal.provider';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentGatewaysController],
  providers: [
    PaymentGatewaysService,
    StripeProvider,
    PayPalProvider,
  ],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysModule {}

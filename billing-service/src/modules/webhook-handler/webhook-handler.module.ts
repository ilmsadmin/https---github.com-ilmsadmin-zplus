import { Module } from '@nestjs/common';
import { WebhookHandlerService } from './webhook-handler.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    InvoicesModule,
    PaymentsModule,
    SubscriptionsModule,
  ],
  providers: [WebhookHandlerService],
  exports: [WebhookHandlerService],
})
export class WebhookHandlerModule {}

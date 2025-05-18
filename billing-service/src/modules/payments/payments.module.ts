import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    EventEmitterModule.forRoot(),
    InvoicesModule,
    PaymentGatewaysModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

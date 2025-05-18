import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private invoicesService: InvoicesService,
    private paymentGatewaysService: PaymentGatewaysService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Get the invoice to ensure it exists
    const invoice = await this.invoicesService.findOne(createPaymentDto.invoiceId);
    
    // Create the payment
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      tenantId: invoice.tenantId,
      paymentDate: createPaymentDto.paymentDate || new Date(),
      status: createPaymentDto.status || PaymentStatus.PENDING,
    });
    
    // If there's a payment method ID and gateway, process the payment
    if (createPaymentDto.paymentMethodId && createPaymentDto.paymentGateway) {
      try {
        const paymentProvider = this.paymentGatewaysService.getProvider(createPaymentDto.paymentGateway);
        
        const result = await paymentProvider.processPayment(
          payment.amount,
          payment.currency,
          createPaymentDto.paymentMethodId,
          {
            invoiceId: payment.invoiceId,
            tenantId: payment.tenantId,
            customerId: createPaymentDto.externalCustomerId,
          }
        );
        
        // Update payment with external details
        payment.externalPaymentId = result.id;
        payment.status = result.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.PROCESSING;
        
        // If the payment was successful, update the invoice status
        if (payment.status === PaymentStatus.SUCCEEDED) {
          await this.invoicesService.markAsPaid(invoice.id);
        }
      } catch (error) {
        // Log error and set status to failed
        console.error('Payment processing failed:', error);
        payment.status = PaymentStatus.FAILED;
      }
    }
    
    const savedPayment = await this.paymentsRepository.save(payment);
    
    // Emit event
    this.eventEmitter.emit('payment.created', savedPayment);
    
    return savedPayment;
  }

  async findAll(options?: { tenantId?: string; status?: PaymentStatus }): Promise<Payment[]> {
    const queryBuilder = this.paymentsRepository.createQueryBuilder('payment');
    
    if (options?.tenantId) {
      queryBuilder.where('payment.tenantId = :tenantId', { tenantId: options.tenantId });
    }
    
    if (options?.status) {
      queryBuilder.andWhere('payment.status = :status', { status: options.status });
    }
    
    return queryBuilder
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }
    
    return payment;
  }

  async findByExternalId(externalPaymentId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { externalPaymentId },
      relations: ['invoice'],
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment with external ID "${externalPaymentId}" not found`);
    }
    
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    
    // Don't allow updating succeeded or refunded payments
    if ([PaymentStatus.SUCCEEDED, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED].includes(payment.status)) {
      throw new BadRequestException(`Cannot update payment with status ${payment.status}`);
    }
    
    const updatedPayment = this.paymentsRepository.merge(payment, updatePaymentDto);
    const savedPayment = await this.paymentsRepository.save(updatedPayment);
    
    this.eventEmitter.emit('payment.updated', savedPayment);
    return savedPayment;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const payment = await this.findOne(id);
    
    // Update payment status
    payment.status = status;
    
    // If payment succeeded, update invoice status
    if (status === PaymentStatus.SUCCEEDED) {
      await this.invoicesService.markAsPaid(payment.invoiceId);
    }
    
    const savedPayment = await this.paymentsRepository.save(payment);
    
    this.eventEmitter.emit('payment.status.updated', savedPayment);
    return savedPayment;
  }

  async refund(id: string, amount?: number): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException(`Cannot refund a payment with status ${payment.status}`);
    }
    
    // Default to full refund if amount not specified
    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      throw new BadRequestException(`Refund amount (${refundAmount}) cannot be greater than payment amount (${payment.amount})`);
    }
    
    try {
      const paymentProvider = this.paymentGatewaysService.getProvider(payment.paymentGateway);
      
      // Process the refund
      await paymentProvider.refundPayment(payment.externalPaymentId, refundAmount);
      
      // Update payment status and refunded amount
      payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
      payment.status = payment.refundedAmount >= payment.amount 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIALLY_REFUNDED;
      
      const savedPayment = await this.paymentsRepository.save(payment);
      
      // Emit refund event
      this.eventEmitter.emit('payment.refunded', {
        ...savedPayment,
        refundAmount,
      });
      
      return savedPayment;
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }
}

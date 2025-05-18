import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private subscriptionsService: SubscriptionsService,
    private paymentGatewaysService: PaymentGatewaysService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Validate subscription
    const subscription = await this.subscriptionsService.findOne(createInvoiceDto.subscriptionId);
    
    // Generate invoice number
    const invoicePrefix = this.configService.get<string>('billing.invoicePrefix', 'INV');
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Get the latest invoice to determine the next number
    const latestInvoice = await this.invoicesRepository.findOne({
      where: {
        invoiceNumber: Between(`${invoicePrefix}-${year}${month}-0001`, `${invoicePrefix}-${year}${month}-9999`),
      },
      order: { 
        invoiceNumber: 'DESC',
      },
    });
    
    let nextNumber = 1;
    if (latestInvoice) {
      const parts = latestInvoice.invoiceNumber.split('-');
      nextNumber = parseInt(parts[parts.length - 1]) + 1;
    }
    
    const invoiceNumber = `${invoicePrefix}-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    
    // Create the invoice
    const invoice = this.invoicesRepository.create({
      ...createInvoiceDto,
      invoiceNumber,
      issueDate: createInvoiceDto.issueDate || new Date(),
      dueDate: createInvoiceDto.dueDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() + 15); // Default: 15 days from now
        return date;
      })(),
      status: createInvoiceDto.status || InvoiceStatus.DRAFT,
      tenantId: subscription.tenantId,
    });
    
    const savedInvoice = await this.invoicesRepository.save(invoice);
    
    // Emit event
    this.eventEmitter.emit('invoice.created', savedInvoice);
    
    return savedInvoice;
  }

  async findAll(options?: { tenantId?: string; status?: InvoiceStatus; from?: Date; to?: Date }): Promise<Invoice[]> {
    const queryBuilder = this.invoicesRepository.createQueryBuilder('invoice');
    
    if (options?.tenantId) {
      queryBuilder.where('invoice.tenantId = :tenantId', { tenantId: options.tenantId });
    }
    
    if (options?.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: options.status });
    }
    
    if (options?.from && options?.to) {
      queryBuilder.andWhere('invoice.issueDate BETWEEN :from AND :to', { 
        from: options.from, 
        to: options.to,
      });
    } else if (options?.from) {
      queryBuilder.andWhere('invoice.issueDate >= :from', { from: options.from });
    } else if (options?.to) {
      queryBuilder.andWhere('invoice.issueDate <= :to', { to: options.to });
    }
    
    return queryBuilder
      .leftJoinAndSelect('invoice.subscription', 'subscription')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .leftJoinAndSelect('invoice.items', 'items')
      .orderBy('invoice.issueDate', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['subscription', 'payments', 'items'],
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }
    
    return invoice;
  }

  async findByNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { invoiceNumber },
      relations: ['subscription', 'payments', 'items'],
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with number "${invoiceNumber}" not found`);
    }
    
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    // Don't allow updating paid or void invoices
    if ([InvoiceStatus.PAID, InvoiceStatus.VOID].includes(invoice.status)) {
      throw new BadRequestException(`Cannot update invoice with status ${invoice.status}`);
    }
    
    const updatedInvoice = this.invoicesRepository.merge(invoice, updateInvoiceDto);
    const savedInvoice = await this.invoicesRepository.save(updatedInvoice);
    
    this.eventEmitter.emit('invoice.updated', savedInvoice);
    return savedInvoice;
  }

  async findOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();
    
    return this.invoicesRepository.find({
      where: {
        dueDate: LessThan(today),
        status: InvoiceStatus.PENDING,
      },
      relations: ['subscription'],
    });
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    if (invoice.status === InvoiceStatus.PAID) {
      return invoice; // Already paid
    }
    
    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    
    const savedInvoice = await this.invoicesRepository.save(invoice);
    
    this.eventEmitter.emit('invoice.paid', savedInvoice);
    return savedInvoice;
  }

  async markAsOverdue(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    if ([InvoiceStatus.PAID, InvoiceStatus.VOID, InvoiceStatus.CANCELED].includes(invoice.status)) {
      throw new BadRequestException(`Cannot mark invoice with status ${invoice.status} as overdue`);
    }
    
    invoice.status = InvoiceStatus.OVERDUE;
    
    const savedInvoice = await this.invoicesRepository.save(invoice);
    
    this.eventEmitter.emit('invoice.overdue', savedInvoice);
    return savedInvoice;
  }

  async voidInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot void a paid invoice');
    }
    
    invoice.status = InvoiceStatus.VOID;
    
    const savedInvoice = await this.invoicesRepository.save(invoice);
    
    this.eventEmitter.emit('invoice.voided', savedInvoice);
    return savedInvoice;
  }

  async generateSubscriptionInvoice(subscriptionId: string): Promise<Invoice> {
    const subscription = await this.subscriptionsService.findOne(subscriptionId);
    const plan = subscription.plan;
    
    const invoiceDto: CreateInvoiceDto = {
      subscriptionId,
      amount: plan.price,
      currency: 'USD', // Default currency, should come from config
      description: `Subscription fee for ${plan.name} plan`,
      items: [
        {
          description: `${plan.name} Plan - ${plan.billingCycle} billing`,
          quantity: 1,
          unitPrice: plan.price,
          amount: plan.price,
        }
      ],
    };
    
    return this.create(invoiceDto);
  }
}

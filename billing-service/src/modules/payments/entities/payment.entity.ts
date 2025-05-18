import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

@Entity('payments')
export class Payment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  @Column()
  invoiceId: string;

  @ApiProperty({ description: 'Amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  @Column({ default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Payment date' })
  @Column({ type: 'timestamp with time zone' })
  paymentDate: Date;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'External transaction ID' })
  @Column({ nullable: true })
  transactionId: string;

  @ApiProperty({ description: 'Status', enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment provider' })
  @Column({ default: 'stripe' })
  paymentProvider: string;

  @ApiProperty({ description: 'Refund amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @ApiProperty({ description: 'Refund date' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  refundDate: Date;

  @ApiProperty({ description: 'Refund reason' })
  @Column({ nullable: true })
  refundReason: string;

  @ApiProperty({ description: 'Payment metadata' })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Error message' })
  @Column({ nullable: true })
  errorMessage: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;
}

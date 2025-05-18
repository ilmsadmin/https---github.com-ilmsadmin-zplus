import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELED = 'canceled',
  VOID = 'void',
}

@Entity('invoices')
export class Invoice {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Subscription ID' })
  @Column()
  subscriptionId: string;

  @ApiProperty({ description: 'Invoice number' })
  @Column()
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  @Column({ default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Issue date' })
  @Column({ type: 'timestamp with time zone' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date' })
  @Column({ type: 'timestamp with time zone' })
  dueDate: Date;

  @ApiProperty({ description: 'Status', enum: InvoiceStatus })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Invoice items' })
  @Column({ type: 'jsonb', default: '[]' })
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Subtotal' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @ApiProperty({ description: 'Tax rate' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @ApiProperty({ description: 'Discount amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({ description: 'Invoice notes' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'PDF URL' })
  @Column({ nullable: true })
  pdfUrl: string;

  @ApiProperty({ description: 'Customer email for invoice' })
  @Column({ nullable: true })
  customerEmail: string;

  @ApiProperty({ description: 'Customer billing address' })
  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @ApiProperty({ description: 'Reminder sent at' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  reminderSentAt: Date;

  @ApiProperty({ description: 'Payment due reminder sent' })
  @Column({ default: false })
  reminderSent: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Subscription, subscription => subscription.invoices)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];
}

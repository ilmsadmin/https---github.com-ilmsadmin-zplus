import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../../plans/entities/plan.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum RenewalType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Plan ID' })
  @Column()
  planId: string;

  @ApiProperty({ description: 'Start date' })
  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  @Column({ type: 'timestamp with time zone' })
  endDate: Date;

  @ApiProperty({ description: 'Status', enum: SubscriptionStatus })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Renewal type', enum: RenewalType })
  @Column({
    type: 'enum',
    enum: RenewalType,
    default: RenewalType.AUTO,
  })
  renewalType: RenewalType;

  @ApiProperty({ description: 'Cancellation date' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  canceledAt: Date;

  @ApiProperty({ description: 'Cancellation reason' })
  @Column({ nullable: true })
  cancelReason: string;

  @ApiProperty({ description: 'Trial end date' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndDate: Date;

  @ApiProperty({ description: 'External subscription ID (e.g., Stripe)' })
  @Column({ nullable: true })
  externalId: string;

  @ApiProperty({ description: 'Custom metadata' })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Plan, plan => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @OneToMany(() => Invoice, invoice => invoice.subscription)
  invoices: Invoice[];
}

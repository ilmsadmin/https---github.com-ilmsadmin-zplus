import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PlanFeature } from '../../plan-features/entities/plan-feature.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('plans')
export class Plan {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Plan name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Plan description' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Plan price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Whether the plan is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Trial period in days' })
  @Column({ default: 0 })
  trialPeriodDays: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PlanFeature, planFeature => planFeature.plan)
  features: PlanFeature[];

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];
}

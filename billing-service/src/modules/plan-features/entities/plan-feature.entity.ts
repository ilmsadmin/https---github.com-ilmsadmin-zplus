import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../../plans/entities/plan.entity';

@Entity('plan_features')
export class PlanFeature {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Plan ID' })
  @Column()
  planId: string;

  @ApiProperty({ description: 'Feature name' })
  @Column()
  featureName: string;

  @ApiProperty({ description: 'Feature value' })
  @Column()
  featureValue: string;

  @ApiProperty({ description: 'Whether the feature is enabled' })
  @Column({ default: true })
  isEnabled: boolean;

  @ApiProperty({ description: 'Feature description' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Plan, plan => plan.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;
}

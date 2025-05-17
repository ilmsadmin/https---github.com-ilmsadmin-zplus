import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'max_users', type: 'int', default: 0 })
  maxUsers: number;

  @Column({ name: 'max_storage', type: 'bigint', default: 0 })
  maxStorage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ 
    name: 'billing_cycle', 
    type: 'varchar', 
    length: 20, 
    default: 'monthly',
    enum: ['monthly', 'quarterly', 'yearly'] 
  })
  billingCycle: string;

  @Column({ type: 'jsonb', default: '{}' })
  features: Record<string, any>;

  @Column({ name: 'api_rate_limit', type: 'int', default: 1000 })
  apiRateLimit: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Tenant, tenant => tenant.package)
  tenants: Tenant[];
}

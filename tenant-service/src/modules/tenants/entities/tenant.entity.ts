import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Package } from '../../packages/entities/package.entity';
import { Domain } from '../../domains/entities/domain.entity';
import { TenantModule } from '../../tenant-modules/entities/tenant-module.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'schema_name', length: 100, unique: true })
  schemaName: string;

  @Column({ name: 'package_id', type: 'uuid' })
  packageId: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'active',
    enum: ['active', 'suspended', 'deleted'] 
  })
  status: string;

  @Column({ name: 'billing_email', length: 255, nullable: true })
  billingEmail: string;

  @Column({ name: 'billing_address', type: 'text', nullable: true })
  billingAddress: string;

  @Column({ name: 'billing_info', type: 'jsonb', default: '{}' })
  billingInfo: Record<string, any>;

  @Column({ name: 'subscription_start_date', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  subscriptionStartDate: Date;

  @Column({ name: 'subscription_end_date', type: 'timestamp with time zone', nullable: true })
  subscriptionEndDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Package, pkg => pkg.tenants)
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @OneToMany(() => Domain, domain => domain.tenant)
  domains: Domain[];

  @OneToMany(() => TenantModule, tenantModule => tenantModule.tenant)
  tenantModules: TenantModule[];
}

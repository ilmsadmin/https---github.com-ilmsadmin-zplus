import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('domains')
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'domain_name', length: 255, unique: true })
  domainName: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'pending',
    enum: ['pending', 'active', 'disabled'] 
  })
  status: string;

  @Column({ name: 'ssl_enabled', type: 'boolean', default: true })
  sslEnabled: boolean;

  @Column({ name: 'ssl_expires_at', type: 'timestamp with time zone', nullable: true })
  sslExpiresAt: Date;

  @Column({ 
    name: 'verification_method', 
    type: 'varchar', 
    length: 20, 
    default: 'txt',
    enum: ['txt', 'cname'] 
  })
  verificationMethod: string;

  @Column({ name: 'verification_token', length: 255, nullable: true })
  verificationToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, tenant => tenant.domains, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

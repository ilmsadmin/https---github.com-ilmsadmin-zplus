import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PasswordPolicy } from '../../common/interfaces/auth.interface';
import { Exclude } from 'class-transformer';

// This entity should match the System DB tenants table
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  schema_name: string;

  @Column({ type: 'uuid' })
  package_id: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  billing_email: string;

  @Column({ nullable: true, type: 'text' })
  billing_address: string;

  @Column({ type: 'jsonb', default: '{}' })
  billing_info: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  auth_settings: {
    passwordPolicy: PasswordPolicy;
    loginAttempts: number;
    lockoutDuration: number;
    mfaEnabled: boolean;
    mfaRequired: boolean;
    allowedOAuthProviders: string[];
    jwtExpiration: string;
    refreshTokenExpiration: string;
    sessionTimeout: number;
  };

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

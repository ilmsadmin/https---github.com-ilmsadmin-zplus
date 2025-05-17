// This is a skeleton model which will dynamically query tenant schemas
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ type: 'uuid' })
  role_id: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  is_mfa_enabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  mfa_secret: string;

  @Column({ default: 'email' })
  mfa_method: string;

  @Column({ nullable: true, type: 'timestamptz' })
  last_login_at: Date;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ default: false })
  is_locked: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  locked_until: Date;

  @Column({ nullable: true })
  @Exclude()
  reset_password_token: string;

  @Column({ nullable: true, type: 'timestamptz' })
  reset_password_expires: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  password_changed_at: Date;

  @Column({ type: 'jsonb', default: '[]' })
  @Exclude()
  password_history: string[];

  @Column({ default: 'en' })
  language: string;

  @Column({ type: 'jsonb', default: '{}' })
  preferences: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

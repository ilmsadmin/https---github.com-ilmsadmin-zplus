import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('system_users')
export class SystemUser {
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
  role: string;

  @Column({ default: false })
  is_mfa_enabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  mfa_secret: string;

  @Column({ nullable: true, type: 'timestamptz' })
  last_login_at: Date;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ nullable: true })
  @Exclude()
  reset_password_token: string;

  @Column({ nullable: true, type: 'timestamptz' })
  reset_password_expires: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

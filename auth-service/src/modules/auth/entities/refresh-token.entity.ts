import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column()
  token: string;

  @Column()
  user_type: string; // 'system_user' or 'tenant_user'

  @Column({ nullable: true, type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ type: 'varchar', nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}

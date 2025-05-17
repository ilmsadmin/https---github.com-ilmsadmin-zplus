import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  jti: string; // JWT ID

  @Column({ type: 'uuid' })
  user_id: string;

  @Column()
  user_type: string; // 'system_user' or 'tenant_user'

  @Column({ nullable: true, type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'varchar', nullable: true })
  revoked_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  revoked_at: Date;
}

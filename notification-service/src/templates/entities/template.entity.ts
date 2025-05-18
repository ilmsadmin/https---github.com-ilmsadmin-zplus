import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { NotificationChannel } from '../../notifications/enums/notification-channel.enum';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  code: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.EMAIL],
  })
  supportedChannels: NotificationChannel[];

  @Column({ type: 'text', nullable: true })
  emailSubject: string;

  @Column({ type: 'text', nullable: true })
  emailHtmlContent: string;

  @Column({ type: 'text', nullable: true })
  emailTextContent: string;

  @Column({ type: 'text', nullable: true })
  pushTitle: string;

  @Column({ type: 'text', nullable: true })
  pushBody: string;

  @Column({ type: 'text', nullable: true })
  smsContent: string;

  @Column({ type: 'text', nullable: true })
  inAppTitle: string;

  @Column({ type: 'text', nullable: true })
  inAppContent: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultVariables: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

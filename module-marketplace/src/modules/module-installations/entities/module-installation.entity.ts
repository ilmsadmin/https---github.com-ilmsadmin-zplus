import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('module_installations')
export class ModuleInstallation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ type: 'uuid' })
  moduleVersionId: string;

  @Column({ length: 20, default: 'active' })
  status: string; // 'active', 'disabled', 'uninstalled'

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  customSettings: Record<string, any>;

  @Column({ type: 'uuid' })
  installedBy: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  disabledAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  uninstalledAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

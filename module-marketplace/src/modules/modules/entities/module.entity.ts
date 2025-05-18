import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ModuleVersion } from '../../module-versions/entities/module-version.entity';
import { ModuleFeatureFlag } from '../../feature-flags/entities/module-feature-flag.entity';

@Entity('modules')
export class ModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255, nullable: true })
  icon: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ length: 50 })
  type: string; // 'core', 'extension', 'integration', etc.

  @Column({ type: 'jsonb', default: '{}' })
  configSchema: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  publisherId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
  @OneToMany(() => ModuleVersion, version => version.module)
  versions: ModuleVersion[];

  @OneToMany(() => ModuleFeatureFlag, featureFlag => featureFlag.module)
  featureFlags: ModuleFeatureFlag[];
}

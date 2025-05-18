import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ModuleEntity } from '../../modules/entities/module.entity';

@Entity('module_feature_flags')
export class ModuleFeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  description: string;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;

  @Column({ default: true })
  isConfigurable: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => ModuleEntity, module => module.featureFlags)
  @JoinColumn({ name: 'moduleId' })
  module: ModuleEntity;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Module } from '../../modules/entities/module.entity';
import { ModuleDependency } from '../../module-dependencies/entities/module-dependency.entity';

@Entity('module_versions')
export class ModuleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ length: 20 })
  version: string;

  @Column({ type: 'text', nullable: true })
  releaseNotes: string;

  @Column({ length: 255 })
  packageUrl: string;

  @Column({ length: 64, nullable: true })
  checksum: string;

  @Column({ default: false })
  isDeprecated: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 20, default: 'development' })
  status: string; // 'development', 'testing', 'production'

  @Column({ type: 'jsonb', default: '{}' })
  compatibility: Record<string, any>; // Compatibility requirements

  @Column({ type: 'jsonb', default: '{}' })
  artifacts: Record<string, any>; // Info about different artifacts (backend, frontend, etc.)

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Module, module => module.versions)
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @OneToMany(() => ModuleDependency, dependency => dependency.dependentVersion)
  dependencies: ModuleDependency[];
}

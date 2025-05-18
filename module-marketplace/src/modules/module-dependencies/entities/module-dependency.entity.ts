import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ModuleVersion } from '../../module-versions/entities/module-version.entity';

@Entity('module_dependencies')
export class ModuleDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dependentVersionId: string;

  @Column({ type: 'uuid' })
  dependencyModuleId: string;

  @Column({ length: 50 })
  versionRequirement: string; // semver range, e.g. "^1.0.0"

  @Column({ default: false })
  isOptional: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => ModuleVersion, version => version.dependencies)
  @JoinColumn({ name: 'dependentVersionId' })
  dependentVersion: ModuleVersion;
}

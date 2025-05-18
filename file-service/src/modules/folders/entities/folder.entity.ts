import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'parent_id', nullable: true })
  @Index()
  parentId: string;

  @ManyToOne(() => FolderEntity, folder => folder.children)
  @JoinColumn({ name: 'parent_id' })
  parent: FolderEntity;

  @OneToMany(() => FolderEntity, folder => folder.parent)
  children: FolderEntity[];

  @OneToMany(() => FileEntity, file => file.folder)
  files: FileEntity[];

  @Column({ name: 'creator_id' })
  creatorId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'path', length: 1000 })
  path: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: false })
  @Index()
  deleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('file_versions')
export class FileVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'storage_location' })
  storageLocation: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 255 })
  mimeType: string;

  @Column({ name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ name: 'creator_id' })
  @Index()
  creatorId: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'change_description', nullable: true })
  changeDescription: string;

  @ManyToOne(() => FileEntity, file => file.versions)
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @Column({ name: 'file_id' })
  @Index()
  fileId: string;

  @Column({ default: false })
  encrypted: boolean;

  @Column({ name: 'encryption_key', nullable: true })
  encryptionKey: string;

  @Column({ name: 'virus_scanned', default: false })
  virusScanned: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

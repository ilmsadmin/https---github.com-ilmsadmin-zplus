import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { FolderEntity } from '../../folders/entities/folder.entity';
import { FileVersionEntity } from './file-version.entity';
import { FileShareEntity } from '../../sharing/entities/file-share.entity';
import { FileTagEntity } from './file-tag.entity';

export enum FileStatus {
  UPLOADING = 'uploading',
  ACTIVE = 'active',
  DELETED = 'deleted',
  VIRUS_DETECTED = 'virus_detected',
  PROCESSING = 'processing',
}

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ length: 255 })
  extension: string;

  @Column({ length: 255 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  path: string;

  @Column({ name: 'storage_location' })
  storageLocation: string;

  @Column({ name: 'bucket_name' })
  bucketName: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.ACTIVE,
  })
  status: FileStatus;

  @Column({ default: false })
  encrypted: boolean;

  @Column({ name: 'encryption_key', nullable: true })
  encryptionKey: string;

  @Column({ name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ name: 'virus_scanned', default: false })
  virusScanned: boolean;

  @Column({ name: 'creator_id' })
  creatorId: string;
  
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => FolderEntity, folder => folder.files)
  @JoinColumn({ name: 'folder_id' })
  folder: FolderEntity;

  @Column({ name: 'folder_id', nullable: true })
  folderId: string;

  @OneToMany(() => FileVersionEntity, version => version.file)
  versions: FileVersionEntity[];

  @OneToMany(() => FileShareEntity, share => share.file)
  shares: FileShareEntity[];

  @OneToMany(() => FileTagEntity, tag => tag.file)
  tags: FileTagEntity[];

  @Column({ name: 'current_version_id', nullable: true })
  currentVersionId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}

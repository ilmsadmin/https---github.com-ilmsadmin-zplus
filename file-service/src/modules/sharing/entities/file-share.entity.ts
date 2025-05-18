import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity';

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
  DOWNLOAD = 'download',
  ADMIN = 'admin',
}

export enum ShareType {
  USER = 'user',
  TEAM = 'team',
  LINK = 'link',
}

@Entity('file_shares')
export class FileShareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => FileEntity, file => file.shares)
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @Column({ name: 'file_id' })
  @Index()
  fileId: string;

  @Column({
    type: 'enum',
    enum: ShareType,
    default: ShareType.USER,
  })
  type: ShareType;

  @Column({ name: 'shared_with', nullable: true })
  sharedWith: string;

  @Column({ name: 'shared_by' })
  sharedBy: string;

  @Column({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  permission: SharePermission;

  @Column({ name: 'access_key', nullable: true })
  accessKey: string;

  @Column({ name: 'password_protected', default: false })
  passwordProtected: boolean;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'max_downloads', nullable: true })
  maxDownloads: number;

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed: Date;
}

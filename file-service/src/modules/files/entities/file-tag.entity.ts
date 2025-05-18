import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('file_tags')
export class FileTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => FileEntity, file => file.tags)
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @Column({ name: 'file_id' })
  @Index()
  fileId: string;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('permissions')
export class Permission {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Permission name' })
  @Column()
  @Index({ unique: true })
  name: string;

  @ApiProperty({ description: 'Permission description' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Resource this permission applies to' })
  @Column()
  @Index()
  resource: string;

  @ApiProperty({ description: 'Action this permission allows' })
  @Column()
  action: string;

  @ApiProperty({ description: 'Conditions for the permission, in JSON format' })
  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @ApiProperty({ description: 'Whether this is a system permission' })
  @Column({ default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

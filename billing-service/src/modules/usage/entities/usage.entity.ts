import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('usage')
export class Usage {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Resource type' })
  @Column()
  resourceType: string;

  @ApiProperty({ description: 'Quantity used' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ description: 'Usage date' })
  @Column({ type: 'timestamp with time zone' })
  recordedDate: Date;

  @ApiProperty({ description: 'Unit of measurement' })
  @Column({ default: 'count' })
  unit: string;

  @ApiProperty({ description: 'Source of the usage data' })
  @Column({ nullable: true })
  source: string;

  @ApiProperty({ description: 'User ID who triggered the usage' })
  @Column({ nullable: true })
  userId: string;

  @ApiProperty({ description: 'Description' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Associated subscription ID' })
  @Column({ nullable: true })
  subscriptionId: string;

  @ApiProperty({ description: 'Associated invoice ID' })
  @Column({ nullable: true })
  invoiceId: string;

  @ApiProperty({ description: 'Whether this usage has been billed' })
  @Column({ default: false })
  billed: boolean;

  @ApiProperty({ description: 'Metadata' })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('performance_reviews')
export class Performance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'uuid' })
  reviewerId: string;

  @Column({ type: 'date' })
  reviewDate: Date;

  @Column({ type: 'int' })
  rating: number; // 1-5 scale

  @Column({ length: 255, nullable: true })
  strengths: string;

  @Column({ length: 255, nullable: true })
  weaknesses: string;

  @Column({ length: 255, nullable: true })
  goals: string;

  @Column({ length: 255, nullable: true })
  comments: string;

  @Column({ type: 'jsonb', default: '{}' })
  scores: Record<string, number>; // Detailed scores by category

  @Column({ length: 50, default: 'completed' })
  status: string; // draft, in-progress, completed

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: Employee;
}

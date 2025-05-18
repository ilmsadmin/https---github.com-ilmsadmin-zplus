import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Position } from '../../positions/entities/position.entity';
import { Document } from '../../documents/entities/document.entity';
import { Leave } from '../../leaves/entities/leave.entity';
import { Performance } from '../../performance/entities/performance.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'date' })
  dateOfJoining: Date;

  @Column({ type: 'date', nullable: true })
  dateOfTermination: Date;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 50, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 50, nullable: true })
  country: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId: string;

  @Column({ type: 'uuid', nullable: true })
  positionId: string;

  @Column({ length: 50, nullable: true })
  employeeNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ length: 50, default: 'active' })
  status: string; // active, on-leave, terminated, etc.

  @Column({ type: 'jsonb', default: '{}' })
  additionalInfo: Record<string, any>;

  @Column({ nullable: true })
  managerId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'managerId' })
  manager: Employee;

  @OneToMany(() => Employee, employee => employee.manager)
  subordinates: Employee[];

  @OneToMany(() => Document, document => document.employee)
  documents: Document[];

  @OneToMany(() => Leave, leave => leave.employee)
  leaves: Leave[];

  @OneToMany(() => Performance, performance => performance.employee)
  performanceReviews: Performance[];
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';
import { Team } from '../../teams/entities/team.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true })
  @Index()
  email: string;

  @ApiProperty({ description: 'First name' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Column()
  lastName: string;

  @Column({ select: false })
  password: string;

  @ApiProperty({ description: 'User status' })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({ description: 'Whether the email is verified' })
  @Column({ default: false })
  emailVerified: boolean;

  @ApiProperty({ description: 'Job title' })
  @Column({ nullable: true })
  jobTitle: string;

  @ApiProperty({ description: 'Department' })
  @Column({ nullable: true })
  department: string;

  @ApiProperty({ description: 'Phone number' })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({ description: 'Profile picture URL' })
  @Column({ nullable: true })
  profilePictureUrl: string;

  @ApiProperty({ description: 'Last login date' })
  @Column({ nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: 'Whether MFA is enabled' })
  @Column({ default: false })
  mfaEnabled: boolean;

  @ApiProperty({ description: 'MFA secret key', required: false })
  @Column({ nullable: true, select: false })
  mfaSecret: string;

  @ApiProperty({ description: 'Preferred language' })
  @Column({ default: 'en' })
  language: string;

  @ApiProperty({ description: 'Preferred theme' })
  @Column({ default: 'light' })
  theme: string;

  @ApiProperty({ description: 'User metadata', type: 'object' })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'User preferences', type: 'object' })
  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Team, team => team.members)
  teams: Team[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

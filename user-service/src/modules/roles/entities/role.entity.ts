import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('roles')
export class Role {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Role name' })
  @Column()
  @Index({ unique: true })
  name: string;

  @ApiProperty({ description: 'Role description' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Whether this is a system role' })
  @Column({ default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether this is a default role for new users' })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Role scope (global, team, etc)' })
  @Column({ default: 'tenant' })
  scope: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('teams')
export class Team {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Team name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Team description' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Parent team ID' })
  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Team, team => team.children)
  @JoinColumn({ name: 'parentId' })
  parent: Team;

  @OneToMany(() => Team, team => team.parent)
  children: Team[];

  @ManyToMany(() => User, user => user.teams)
  @JoinTable({
    name: 'team_members',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @ApiProperty({ description: 'Team settings', type: 'object' })
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

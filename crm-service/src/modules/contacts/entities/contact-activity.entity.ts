import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity('contact_activities')
export class ContactActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contactId: string;

  @Column({ length: 50 })
  type: string;  // call, email, meeting, note, task, etc.

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate: Date;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Contact, contact => contact.activities)
  @JoinColumn({ name: 'contactId' })
  contact: Contact;
}

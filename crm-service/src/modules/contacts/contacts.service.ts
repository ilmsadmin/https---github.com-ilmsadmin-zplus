import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contact } from './entities/contact.entity';
import { ContactActivity } from './entities/contact-activity.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ITenantContext } from '../../common/interfaces/tenant-context.interface';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactActivity)
    private readonly activityRepository: Repository<ContactActivity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createContactDto: CreateContactDto, context: ITenantContext): Promise<Contact> {
    // Check if email already exists
    const existingContact = await this.contactRepository.findOne({
      where: { email: createContactDto.email } as FindOptionsWhere<Contact>,
    });

    if (existingContact) {
      throw new BadRequestException(`Contact with email ${createContactDto.email} already exists`);
    }

    // Create new contact
    const contact = this.contactRepository.create({
      ...createContactDto,
      createdBy: context.userId,
    });

    const savedContact = await this.contactRepository.save(contact);

    // Emit event
    this.eventEmitter.emit('contact.created', {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
      contact: savedContact,
      userId: context.userId,
    });

    return savedContact;
  }

  async findAll(context: ITenantContext, options?: any): Promise<Contact[]> {
    const queryOptions: any = {};
    
    if (options?.ownerId) {
      queryOptions.where = { ownerId: options.ownerId };
    }
    
    if (options?.status) {
      queryOptions.where = { 
        ...queryOptions.where,
        status: options.status 
      };
    }
    
    return this.contactRepository.find(queryOptions);
  }

  async findOne(id: string, context: ITenantContext): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id } as FindOptionsWhere<Contact>,
      relations: ['activities'],
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, context: ITenantContext): Promise<Contact> {
    const contact = await this.findOne(id, context);

    // Check email uniqueness if email is being updated
    if (updateContactDto.email && updateContactDto.email !== contact.email) {
      const existingContact = await this.contactRepository.findOne({
        where: { email: updateContactDto.email } as FindOptionsWhere<Contact>,
      });

      if (existingContact && existingContact.id !== id) {
        throw new BadRequestException(`Contact with email ${updateContactDto.email} already exists`);
      }
    }

    // Update contact
    const updatedContact = await this.contactRepository.save({
      ...contact,
      ...updateContactDto,
    });

    // Emit event
    this.eventEmitter.emit('contact.updated', {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
      contact: updatedContact,
      userId: context.userId,
    });

    return updatedContact;
  }

  async remove(id: string, context: ITenantContext): Promise<void> {
    const contact = await this.findOne(id, context);

    await this.contactRepository.remove(contact);

    // Emit event
    this.eventEmitter.emit('contact.deleted', {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
      contactId: id,
      userId: context.userId,
    });
  }

  // Activity-related methods
  async addActivity(contactId: string, activityData: any, context: ITenantContext): Promise<ContactActivity> {
    const contact = await this.findOne(contactId, context);

    const activity = this.activityRepository.create({
      ...activityData,
      contactId: contact.id,
      createdBy: context.userId,
    });

    return this.activityRepository.save(activity);
  }

  async getActivities(contactId: string, context: ITenantContext): Promise<ContactActivity[]> {
    const contact = await this.findOne(contactId, context);

    return this.activityRepository.find({
      where: { contactId: contact.id } as FindOptionsWhere<ContactActivity>,
      order: { createdAt: 'DESC' },
    });
  }
}

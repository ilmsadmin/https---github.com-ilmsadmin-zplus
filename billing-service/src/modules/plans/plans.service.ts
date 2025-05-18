import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.plansRepository.create(createPlanDto);
    const savedPlan = await this.plansRepository.save(plan);
    
    this.eventEmitter.emit('plan.created', savedPlan);
    return savedPlan;
  }

  async findAll(options?: { isActive?: boolean }): Promise<Plan[]> {
    const queryBuilder = this.plansRepository.createQueryBuilder('plan');
    
    if (options?.isActive !== undefined) {
      queryBuilder.where('plan.isActive = :isActive', { isActive: options.isActive });
    }
    
    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({ 
      where: { id },
      relations: ['features', 'subscriptions'],
    });
    
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    
    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    const updatedPlan = this.plansRepository.merge(plan, updatePlanDto);
    const savedPlan = await this.plansRepository.save(updatedPlan);
    
    this.eventEmitter.emit('plan.updated', savedPlan);
    return savedPlan;
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.plansRepository.softDelete(id);
    
    this.eventEmitter.emit('plan.deleted', plan);
  }

  async activate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = true;
    const savedPlan = await this.plansRepository.save(plan);
    
    this.eventEmitter.emit('plan.activated', savedPlan);
    return savedPlan;
  }

  async deactivate(id: string): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    const savedPlan = await this.plansRepository.save(plan);
    
    this.eventEmitter.emit('plan.deactivated', savedPlan);
    return savedPlan;
  }
}

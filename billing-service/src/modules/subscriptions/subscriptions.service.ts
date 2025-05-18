import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PlansService } from '../plans/plans.service';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    private plansService: PlansService,
    private paymentGatewaysService: PaymentGatewaysService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    // Get the plan to validate it exists and is active
    const plan = await this.plansService.findOne(createSubscriptionDto.planId);
    
    if (!plan.isActive) {
      throw new BadRequestException(`Plan with ID "${plan.id}" is not active`);
    }

    // Calculate end date based on billing cycle
    const startDate = createSubscriptionDto.startDate ? new Date(createSubscriptionDto.startDate) : new Date();
    const endDate = new Date(startDate);
    
    switch (plan.billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Create subscription in database
    const subscription = this.subscriptionsRepository.create({
      ...createSubscriptionDto,
      startDate,
      endDate,
      status: createSubscriptionDto.status || SubscriptionStatus.ACTIVE,
    });

    // Save the subscription
    const savedSubscription = await this.subscriptionsRepository.save(subscription);
    
    // If external gateway subscription ID is not provided, create one
    if (!savedSubscription.externalSubscriptionId && createSubscriptionDto.paymentMethodId) {
      try {
        const paymentProvider = this.paymentGatewaysService.getProvider(createSubscriptionDto.paymentGateway || 'stripe');
        
        const externalSubscription = await paymentProvider.createSubscription(
          createSubscriptionDto.customerId,
          plan.id,
          {
            tenantId: createSubscriptionDto.tenantId,
            subscriptionId: savedSubscription.id,
          }
        );
        
        // Update subscription with external ID
        savedSubscription.externalSubscriptionId = externalSubscription.id;
        await this.subscriptionsRepository.save(savedSubscription);
      } catch (error) {
        // Log error but don't fail - we can retry later
        console.error('Failed to create subscription in payment gateway:', error);
      }
    }
    
    // Emit event
    this.eventEmitter.emit('subscription.created', savedSubscription);
    
    return savedSubscription;
  }

  async findAll(options?: { tenantId?: string; status?: SubscriptionStatus }): Promise<Subscription[]> {
    const queryBuilder = this.subscriptionsRepository.createQueryBuilder('subscription');
    
    if (options?.tenantId) {
      queryBuilder.where('subscription.tenantId = :tenantId', { tenantId: options.tenantId });
    }
    
    if (options?.status) {
      queryBuilder.andWhere('subscription.status = :status', { status: options.status });
    }
    
    return queryBuilder
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.invoices', 'invoices')
      .getMany();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['plan', 'invoices'],
    });
    
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    
    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findOne(id);
    
    // If plan is being changed, validate the new plan
    if (updateSubscriptionDto.planId && updateSubscriptionDto.planId !== subscription.planId) {
      const newPlan = await this.plansService.findOne(updateSubscriptionDto.planId);
      
      if (!newPlan.isActive) {
        throw new BadRequestException(`Plan with ID "${newPlan.id}" is not active`);
      }
      
      // Update external subscription if it exists
      if (subscription.externalSubscriptionId) {
        try {
          const paymentProvider = this.paymentGatewaysService.getProvider(subscription.paymentGateway || 'stripe');
          
          await paymentProvider.updateSubscription(
            subscription.externalSubscriptionId,
            { planId: newPlan.id }
          );
        } catch (error) {
          console.error('Failed to update subscription in payment gateway:', error);
        }
      }
    }
    
    const updatedSubscription = this.subscriptionsRepository.merge(subscription, updateSubscriptionDto);
    const savedSubscription = await this.subscriptionsRepository.save(updatedSubscription);
    
    this.eventEmitter.emit('subscription.updated', savedSubscription);
    return savedSubscription;
  }

  async cancel(id: string, cancelAtPeriodEnd: boolean = false): Promise<Subscription> {
    const subscription = await this.findOne(id);
    
    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException(`Subscription is already canceled`);
    }
    
    // Cancel in external payment gateway if it exists
    if (subscription.externalSubscriptionId) {
      try {
        const paymentProvider = this.paymentGatewaysService.getProvider(subscription.paymentGateway || 'stripe');
        
        await paymentProvider.cancelSubscription(
          subscription.externalSubscriptionId,
          cancelAtPeriodEnd
        );
      } catch (error) {
        console.error('Failed to cancel subscription in payment gateway:', error);
      }
    }
    
    // Update subscription status
    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
    } else {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
    }
    
    const savedSubscription = await this.subscriptionsRepository.save(subscription);
    
    this.eventEmitter.emit('subscription.canceled', savedSubscription);
    return savedSubscription;
  }

  async findExpiringSubscriptions(daysFromNow: number = 7): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    
    return this.subscriptionsRepository.find({
      where: {
        endDate: LessThan(futureDate),
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
      },
      relations: ['plan'],
    });
  }

  async renewSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);
    
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(`Cannot renew a non-active subscription`);
    }
    
    // Get the plan
    const plan = await this.plansService.findOne(subscription.planId);
    
    // Calculate new end date
    const newEndDate = new Date(subscription.endDate);
    
    switch (plan.billingCycle) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'quarterly':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'yearly':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }
    
    // Update subscription
    subscription.endDate = newEndDate;
    
    const savedSubscription = await this.subscriptionsRepository.save(subscription);
    
    this.eventEmitter.emit('subscription.renewed', savedSubscription);
    return savedSubscription;
  }
}

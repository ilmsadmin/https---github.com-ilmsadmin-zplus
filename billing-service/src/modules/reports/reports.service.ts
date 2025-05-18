import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  invoicesCount: number;
  paymentsCount: number;
}

export interface SubscriptionReport {
  activePlans: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  mostPopularPlan: {
    planId: string;
    planName: string;
    subscriptionCount: number;
  };
}

export interface InvoiceReport {
  totalInvoiced: number;
  paidInvoices: number;
  overdueInvoices: number;
  pendingInvoices: number;
  averageInvoiceAmount: number;
}

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async getRevenueReport(filter: PeriodFilter, tenantId?: string): Promise<RevenueReport> {
    const queryBuilder = this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      })
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCEEDED });

    if (tenantId) {
      queryBuilder.andWhere('payment.tenantId = :tenantId', { tenantId });
    }

    const totalRevenue = await queryBuilder
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const paymentsCount = await queryBuilder.getCount();

    const invoiceQueryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.issueDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });

    if (tenantId) {
      invoiceQueryBuilder.andWhere('invoice.tenantId = :tenantId', { tenantId });
    }

    const invoicesCount = await invoiceQueryBuilder.getCount();

    // Format period for reporting
    const startMonth = filter.startDate.toLocaleString('default', { month: 'short' });
    const endMonth = filter.endDate.toLocaleString('default', { month: 'short' });
    const year = filter.startDate.getFullYear();
    const period = startMonth === endMonth 
      ? `${startMonth} ${year}` 
      : `${startMonth} - ${endMonth} ${year}`;

    return {
      period,
      totalRevenue: Number(totalRevenue.total) || 0,
      invoicesCount,
      paymentsCount,
    };
  }

  async getSubscriptionReport(tenantId?: string): Promise<SubscriptionReport> {
    const queryBuilder = this.subscriptionsRepository.createQueryBuilder('subscription');
    
    if (tenantId) {
      queryBuilder.andWhere('subscription.tenantId = :tenantId', { tenantId });
    }

    const activeSubscriptions = await queryBuilder
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .getCount();

    const trialSubscriptions = await queryBuilder
      .where('subscription.status = :status', { status: SubscriptionStatus.TRIAL })
      .getCount();

    const canceledSubscriptions = await queryBuilder
      .where('subscription.status = :status', { status: SubscriptionStatus.CANCELED })
      .getCount();

    // Get most popular plan
    const popularPlanQuery = this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .select('subscription.planId', 'planId')
      .addSelect('plan.name', 'planName')
      .addSelect('COUNT(subscription.id)', 'count')
      .leftJoin('subscription.plan', 'plan')
      .groupBy('subscription.planId')
      .addGroupBy('plan.name')
      .orderBy('count', 'DESC')
      .limit(1);

    if (tenantId) {
      popularPlanQuery.where('subscription.tenantId = :tenantId', { tenantId });
    }

    const mostPopularPlan = await popularPlanQuery.getRawOne();

    // Count active plans
    const activePlansCount = await this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .select('DISTINCT subscription.planId')
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .getCount();

    return {
      activePlans: activePlansCount,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      mostPopularPlan: mostPopularPlan ? {
        planId: mostPopularPlan.planId,
        planName: mostPopularPlan.planName,
        subscriptionCount: parseInt(mostPopularPlan.count),
      } : null,
    };
  }

  async getInvoiceReport(filter: PeriodFilter, tenantId?: string): Promise<InvoiceReport> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.issueDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });

    if (tenantId) {
      queryBuilder.andWhere('invoice.tenantId = :tenantId', { tenantId });
    }

    const totalInvoiced = await queryBuilder
      .select('SUM(invoice.amount)', 'total')
      .getRawOne();

    const paidInvoices = await queryBuilder
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .getCount();

    const overdueInvoices = await queryBuilder
      .where('invoice.status = :status', { status: InvoiceStatus.OVERDUE })
      .getCount();

    const pendingInvoices = await queryBuilder
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .getCount();

    const averageQuery = await queryBuilder
      .select('AVG(invoice.amount)', 'average')
      .getRawOne();

    return {
      totalInvoiced: Number(totalInvoiced.total) || 0,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      averageInvoiceAmount: Number(averageQuery.average) || 0,
    };
  }

  async getMRR(date?: Date): Promise<number> {
    const targetDate = date || new Date();
    
    // Get all active subscriptions at the specified date
    const activeSubscriptions = await this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('subscription.startDate <= :date', { date: targetDate })
      .andWhere('subscription.endDate >= :date', { date: targetDate })
      .getMany();
    
    // Calculate MRR based on active subscriptions and their plans
    let mrr = 0;
    
    for (const subscription of activeSubscriptions) {
      const plan = subscription.plan;
      
      if (!plan) continue;
      
      let monthlyPrice = plan.price;
      
      // Convert to monthly price if needed
      switch (plan.billingCycle) {
        case 'yearly':
          monthlyPrice = plan.price / 12;
          break;
        case 'quarterly':
          monthlyPrice = plan.price / 3;
          break;
      }
      
      mrr += monthlyPrice;
    }
    
    return mrr;
  }
}

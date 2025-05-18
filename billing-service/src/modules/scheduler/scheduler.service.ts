import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isSchedulerEnabled: boolean;

  constructor(
    private subscriptionsService: SubscriptionsService,
    private invoicesService: InvoicesService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.isSchedulerEnabled = this.configService.get<boolean>('app.enableScheduler', true);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTasks() {
    if (!this.isSchedulerEnabled) {
      return;
    }

    this.logger.log('Running daily scheduled tasks');
    
    try {
      await this.processSubscriptionRenewals();
      await this.processInvoiceReminders();
      await this.markOverdueInvoices();
    } catch (error) {
      this.logger.error('Error running daily scheduled tasks', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyTasks() {
    if (!this.isSchedulerEnabled) {
      return;
    }

    this.logger.log('Running monthly scheduled tasks');
    
    try {
      await this.generateMonthlyInvoices();
    } catch (error) {
      this.logger.error('Error running monthly scheduled tasks', error.stack);
    }
  }

  private async processSubscriptionRenewals() {
    this.logger.log('Processing subscription renewals');
    
    // Find subscriptions expiring in the next day
    const expiringSubscriptions = await this.subscriptionsService.findExpiringSubscriptions(1);
    
    for (const subscription of expiringSubscriptions) {
      try {
        if (subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd) {
          // Auto-renew subscription
          await this.subscriptionsService.renewSubscription(subscription.id);
          
          // Generate invoice for the renewal
          await this.invoicesService.generateSubscriptionInvoice(subscription.id);
          
          this.logger.log(`Renewed subscription: ${subscription.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to renew subscription ${subscription.id}:`, error.stack);
      }
    }
  }

  private async processInvoiceReminders() {
    this.logger.log('Processing invoice reminders');
    
    // Get invoices due in 3 days
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    const invoicesDueSoon = await this.invoicesService.findAll({
      status: InvoiceStatus.PENDING,
      from: now,
      to: threeDaysFromNow,
    });
    
    for (const invoice of invoicesDueSoon) {
      try {
        // Emit event for notification service to send reminder
        this.eventEmitter.emit('invoice.reminder', {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
        });
        
        this.logger.log(`Sent reminder for invoice: ${invoice.invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to process reminder for invoice ${invoice.id}:`, error.stack);
      }
    }
  }

  private async markOverdueInvoices() {
    this.logger.log('Marking overdue invoices');
    
    const overdueInvoices = await this.invoicesService.findOverdueInvoices();
    
    for (const invoice of overdueInvoices) {
      try {
        await this.invoicesService.markAsOverdue(invoice.id);
        
        // Emit event for notification service to send overdue notice
        this.eventEmitter.emit('invoice.overdue.notification', {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
        });
        
        this.logger.log(`Marked invoice as overdue: ${invoice.invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to mark invoice ${invoice.id} as overdue:`, error.stack);
      }
    }
  }

  private async generateMonthlyInvoices() {
    this.logger.log('Generating monthly invoices');
    
    // Find active subscriptions with monthly billing cycle
    const activeSubscriptions = await this.subscriptionsService.findAll({
      status: SubscriptionStatus.ACTIVE,
    });
    
    // Filter for monthly subscriptions
    const monthlySubscriptions = activeSubscriptions.filter(sub => 
      sub.plan?.billingCycle === 'monthly' && !sub.cancelAtPeriodEnd
    );
    
    for (const subscription of monthlySubscriptions) {
      try {
        await this.invoicesService.generateSubscriptionInvoice(subscription.id);
        this.logger.log(`Generated monthly invoice for subscription: ${subscription.id}`);
      } catch (error) {
        this.logger.error(`Failed to generate invoice for subscription ${subscription.id}:`, error.stack);
      }
    }
  }
}

/**
 * Consumer for tenant events to trigger notifications
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NestKafkaService, Event, TenantEventType } from '@multi-tenant/event-bus';

@Injectable()
export class TenantEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(TenantEventsConsumer.name);

  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    // Subscribe to tenant events that require notifications
    await this.kafkaService.subscribe<Event<any>>(
      'tenant.events',
      async (message, event) => {
        this.logger.debug(`Processing tenant event: ${event.type}`);
        
        try {
          switch (event.type) {
            case TenantEventType.CREATED:
              await this.handleTenantCreated(event);
              break;
              
            case TenantEventType.SUSPENDED:
              await this.handleTenantSuspended(event);
              break;
              
            case TenantEventType.ACTIVATED:
              await this.handleTenantActivated(event);
              break;
              
            case TenantEventType.PACKAGE_CHANGED:
              await this.handleTenantPackageChanged(event);
              break;
          }
        } catch (error) {
          this.logger.error(`Error processing tenant event ${event.type}`, error);
          throw error; // Rethrow to trigger retry/DLQ logic
        }
      },
      { groupId: 'notification-service-tenant-consumer' }
    );
    
    this.logger.log('Subscribed to tenant events');
  }

  /**
   * Handle tenant.created event
   */
  private async handleTenantCreated(event: Event<any>) {
    this.logger.log(`Processing tenant.created event for tenant ${event.data.id}`);
    
    // Logic to send welcome email to tenant admin
    // For example:
    // await this.notificationService.sendWelcomeEmail({
    //   tenantId: event.data.id,
    //   tenantName: event.data.name,
    //   email: event.data.billingEmail,
    //   packageName: await this.packageService.getPackageName(event.data.packageId)
    // });
  }

  /**
   * Handle tenant.suspended event
   */
  private async handleTenantSuspended(event: Event<any>) {
    this.logger.log(`Processing tenant.suspended event for tenant ${event.data.id}`);
    
    // Logic to send suspension notification
    // For example:
    // await this.notificationService.sendTenantSuspendedEmail({
    //   tenantId: event.data.id,
    //   email: await this.tenantService.getBillingEmail(event.data.id),
    //   reason: event.data.reason,
    //   suspendedAt: event.data.suspendedAt
    // });
  }

  /**
   * Handle tenant.activated event
   */
  private async handleTenantActivated(event: Event<any>) {
    this.logger.log(`Processing tenant.activated event for tenant ${event.data.id}`);
    
    // Logic to send activation notification
    // For example:
    // await this.notificationService.sendTenantActivatedEmail({
    //   tenantId: event.data.id,
    //   email: await this.tenantService.getBillingEmail(event.data.id),
    //   activatedAt: event.data.activatedAt,
    //   previousStatus: event.data.previousStatus
    // });
  }

  /**
   * Handle tenant.package_changed event
   */
  private async handleTenantPackageChanged(event: Event<any>) {
    this.logger.log(`Processing tenant.package_changed event for tenant ${event.data.id}`);
    
    // Logic to send package change notification
    // For example:
    // const [oldPackage, newPackage] = await Promise.all([
    //   this.packageService.getPackageDetails(event.data.previousPackageId),
    //   this.packageService.getPackageDetails(event.data.newPackageId)
    // ]);
    // 
    // await this.notificationService.sendPackageChangedEmail({
    //   tenantId: event.data.id,
    //   email: await this.tenantService.getBillingEmail(event.data.id),
    //   oldPackageName: oldPackage.name,
    //   newPackageName: newPackage.name,
    //   effectiveDate: event.data.effectiveDate,
    //   changes: this.packageService.comparePackages(oldPackage, newPackage)
    // });
  }
}

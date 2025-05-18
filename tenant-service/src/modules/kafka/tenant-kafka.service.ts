/**
 * Kafka service for the tenant-service
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { 
  NestKafkaService, 
  TenantEventType, 
  TenantCreatedEventData,
  TenantUpdatedEventData,
  TenantSuspendedEventData,
  TenantActivatedEventData,
  TenantDeletedEventData,
  TenantPackageChangedEventData,
  BaseEvent,
  Event
} from '@multi-tenant/event-bus';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantKafkaService implements OnModuleInit {
  private readonly logger = new Logger(TenantKafkaService.name);
  private readonly TENANT_EVENTS_TOPIC = 'tenant.events';

  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    // Subscribe to any events tenant-service needs to consume
    // For example, if it needs to listen to package changes from another service:
    /*
    await this.kafkaService.subscribe<Event<any>>(
      'package.events',
      async (message, event) => {
        if (event.type === 'package.updated') {
          await this.handlePackageUpdated(event.data);
        }
      },
      { groupId: 'tenant-service-package-consumer' }
    );
    */
  }

  /**
   * Publish a tenant created event
   */
  async publishTenantCreated(data: TenantCreatedEventData): Promise<void> {
    const event: Event<TenantCreatedEventData> = {
      id: uuidv4(),
      type: TenantEventType.CREATED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.created event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.created event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish a tenant updated event
   */
  async publishTenantUpdated(data: TenantUpdatedEventData): Promise<void> {
    const event: Event<TenantUpdatedEventData> = {
      id: uuidv4(),
      type: TenantEventType.UPDATED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.id, // Include tenantId in metadata
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.updated event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.updated event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish a tenant suspended event
   */
  async publishTenantSuspended(data: TenantSuspendedEventData): Promise<void> {
    const event: Event<TenantSuspendedEventData> = {
      id: uuidv4(),
      type: TenantEventType.SUSPENDED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.id,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.suspended event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.suspended event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish a tenant activated event
   */
  async publishTenantActivated(data: TenantActivatedEventData): Promise<void> {
    const event: Event<TenantActivatedEventData> = {
      id: uuidv4(),
      type: TenantEventType.ACTIVATED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.id,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.activated event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.activated event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish a tenant deleted event
   */
  async publishTenantDeleted(data: TenantDeletedEventData): Promise<void> {
    const event: Event<TenantDeletedEventData> = {
      id: uuidv4(),
      type: TenantEventType.DELETED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.id,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.deleted event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.deleted event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish a tenant package changed event
   */
  async publishTenantPackageChanged(data: TenantPackageChangedEventData): Promise<void> {
    const event: Event<TenantPackageChangedEventData> = {
      id: uuidv4(),
      type: TenantEventType.PACKAGE_CHANGED,
      source: 'tenant-service',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: data.id,
      data
    };

    try {
      await this.kafkaService.getKafkaService().produce(
        this.TENANT_EVENTS_TOPIC,
        event
      );
      this.logger.log(`Published tenant.package_changed event for tenant ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish tenant.package_changed event for tenant ${data.id}`,
        error.stack
      );
      throw error;
    }
  }
}

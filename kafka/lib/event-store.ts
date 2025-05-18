/**
 * Event store for implementing event sourcing pattern
 */
import { BaseEvent } from './event-schema';
import { KafkaService } from './kafka-service';
import { Logger } from './logger';

export interface EventStoreOptions {
  kafkaService: KafkaService;
  eventStoreTopic: string;
}

export interface EventQuery {
  aggregateId?: string;
  aggregateType?: string;
  eventTypes?: string[];
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}

export class EventStore {
  private kafkaService: KafkaService;
  private eventStoreTopic: string;
  private logger: Logger;

  constructor(options: EventStoreOptions) {
    this.kafkaService = options.kafkaService;
    this.eventStoreTopic = options.eventStoreTopic;
    this.logger = new Logger('EventStore');
  }

  /**
   * Store an event in the event store
   * @param event The event to store
   * @returns Promise with message offset
   */
  async saveEvent<T extends BaseEvent>(event: T): Promise<number> {
    // Ensure the event has required metadata
    if (!event.id || !event.type || !event.time) {
      throw new Error('Event is missing required metadata (id, type, or time)');
    }

    try {
      // Store the event in the event store topic
      return await this.kafkaService.produce(this.eventStoreTopic, event, {
        key: this.generateEventKey(event),
      });
    } catch (error) {
      this.logger.error('Failed to save event to event store', { eventId: event.id, error });
      throw error;
    }
  }

  /**
   * Generate a key for the event based on aggregate ID and type
   * This helps with partitioning related events together
   */
  private generateEventKey(event: BaseEvent): string {
    // For tenant-specific events, use the tenant ID as part of the key
    if (event.tenantId) {
      return `${event.tenantId}-${event.type}`;
    }
    
    // For system events, use the event type
    return event.type;
  }

  /**
   * Set up a consumer for the event store
   * This is used to rebuild aggregate state or for analytics
   * @param handler Function to handle each event
   * @param options Consumer options
   */
  async subscribeToEventStore<T>(
    handler: (event: T) => Promise<void>,
    options?: { groupId?: string; fromBeginning?: boolean }
  ): Promise<() => Promise<void>> {
    return this.kafkaService.subscribe<T>(
      this.eventStoreTopic,
      async (message, event) => {
        await handler(event);
      },
      {
        groupId: options?.groupId || 'event-store-consumer',
        fromBeginning: options?.fromBeginning || true,
      }
    );
  }
}

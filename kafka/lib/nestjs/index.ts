/**
 * NestJS integration for the Kafka library
 */
import { Module, DynamicModule, Provider, OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';
import { KafkaService, KafkaServiceOptions } from '../kafka-service';
import { EventStore } from '../event-store';

@Injectable()
export class NestKafkaService implements OnModuleInit, OnModuleDestroy {
  private kafkaService: KafkaService;
  private eventStore?: EventStore;
  private stopConsumerFunctions: (() => Promise<void>)[] = [];

  constructor(serviceName: string, options: KafkaServiceOptions) {
    this.kafkaService = new KafkaService(serviceName, options);
  }

  async onModuleInit() {
    await this.kafkaService.connect();
  }

  async onModuleDestroy() {
    // Stop all consumers
    for (const stopFn of this.stopConsumerFunctions) {
      await stopFn();
    }
    
    // Disconnect from Kafka
    await this.kafkaService.disconnect();
  }

  /**
   * Get the underlying KafkaService instance
   */
  getKafkaService(): KafkaService {
    return this.kafkaService;
  }

  /**
   * Initialize and get an EventStore instance
   * @param eventStoreTopic Topic to use for the event store
   */
  getEventStore(eventStoreTopic: string): EventStore {
    if (!this.eventStore) {
      this.eventStore = new EventStore({
        kafkaService: this.kafkaService,
        eventStoreTopic,
      });
    }
    return this.eventStore;
  }

  /**
   * Subscribe to a Kafka topic
   * @param topic Topic to subscribe to
   * @param handler Handler function
   * @param options Consumer options
   */
  async subscribe<T = any>(
    topic: string,
    handler: (message: any, event: T, topic: string) => Promise<void>,
    options?: any
  ): Promise<void> {
    const stopFn = await this.kafkaService.subscribe<T>(topic, handler, options);
    this.stopConsumerFunctions.push(stopFn);
  }
}

/**
 * Options for the NestJS Kafka module
 */
export interface KafkaModuleOptions {
  serviceName: string;
  kafkaOptions: KafkaServiceOptions;
  eventStore?: {
    enabled: boolean;
    topic: string;
  };
}

@Module({})
export class KafkaModule {
  /**
   * Register the Kafka module
   * @param options Module configuration options
   */
  static register(options: KafkaModuleOptions): DynamicModule {
    const kafkaServiceProvider: Provider = {
      provide: NestKafkaService,
      useFactory: () => {
        return new NestKafkaService(options.serviceName, options.kafkaOptions);
      },
    };

    const eventStoreProvider: Provider = {
      provide: EventStore,
      useFactory: (kafkaService: NestKafkaService) => {
        if (options.eventStore?.enabled) {
          return kafkaService.getEventStore(options.eventStore.topic);
        }
        return null;
      },
      inject: [NestKafkaService],
    };

    return {
      module: KafkaModule,
      providers: [kafkaServiceProvider, eventStoreProvider],
      exports: [NestKafkaService, EventStore],
    };
  }
}

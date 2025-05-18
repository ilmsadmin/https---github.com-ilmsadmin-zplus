import { Kafka, Producer, Consumer, KafkaMessage, ProducerRecord, ConsumerConfig, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';
import { BaseEvent } from './event-schema';
import { CircuitBreaker } from './circuit-breaker';

/**
 * Configuration options for the KafkaService
 */
export interface KafkaServiceOptions {
  clientId: string;
  brokers: string[];
  schemaRegistry?: {
    url: string;
    useAvro?: boolean;
  };
  retry?: {
    initialRetryTime: number;
    retries: number;
    maxRetryTime?: number;
    factor?: number;
  };
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

/**
 * Default consumer group ID generator
 */
const generateConsumerGroupId = (serviceName: string, topicName: string): string => {
  return `${serviceName}-${topicName}-group`;
};

/**
 * Options for producing messages
 */
export interface ProduceOptions {
  key?: string;
  headers?: Record<string, string>;
  partition?: number;
}

/**
 * Options for consuming messages
 */
export interface ConsumeOptions {
  groupId?: string;
  autoCommit?: boolean;
  fromBeginning?: boolean;
  maxBytesPerPartition?: number;
  sessionTimeout?: number;
}

/**
 * Handler function for message processing
 */
export type MessageHandler<T = any> = (message: KafkaMessage, event: T, topic: string) => Promise<void>;

/**
 * KafkaService is the main class for interacting with Kafka
 */
export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private logger: Logger;
  private circuitBreaker: CircuitBreaker;
  private options: KafkaServiceOptions;
  private serviceName: string;
  private dlqEnabled: boolean = true;

  /**
   * Create a new KafkaService
   * @param serviceName Name of the service using this kafka instance
   * @param options Configuration options
   */
  constructor(serviceName: string, options: KafkaServiceOptions) {
    this.serviceName = serviceName;
    this.options = options;
    this.logger = new Logger(`${serviceName}:KafkaService`);

    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
      retry: options.retry,
    });

    // Initialize Producer
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      retry: options.retry,
    });

    // Initialize Circuit Breaker for producer
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.circuitBreaker?.failureThreshold || 5,
      resetTimeout: options.circuitBreaker?.resetTimeout || 30000,
      onOpen: () => this.logger.warn('Circuit breaker opened - Kafka producer is unavailable'),
      onClose: () => this.logger.info('Circuit breaker closed - Kafka producer is available again'),
      onHalfOpen: () => this.logger.info('Circuit breaker half-open - Attempting to reconnect to Kafka')
    });
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.info('Connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      
      // Disconnect all consumers
      const disconnectPromises = Array.from(this.consumers.values()).map(consumer => consumer.disconnect());
      await Promise.all(disconnectPromises);
      
      this.logger.info('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error while disconnecting from Kafka', error);
      throw error;
    }
  }

  /**
   * Enable or disable Dead Letter Queue functionality
   * @param enabled Whether to enable DLQ
   */
  setDlqEnabled(enabled: boolean): void {
    this.dlqEnabled = enabled;
  }

  /**
   * Get DLQ topic name for a given topic
   * @param topic Source topic name
   * @returns DLQ topic name
   */
  private getDlqTopicName(topic: string): string {
    return `${topic}.dlq`;
  }

  /**
   * Produce an event to a Kafka topic with circuit breaker pattern
   * @param topic The topic to produce to
   * @param event The event to produce
   * @param options Additional produce options
   * @returns Promise with message offset
   */
  async produce<T extends BaseEvent>(
    topic: string,
    event: T,
    options: ProduceOptions = {}
  ): Promise<number> {
    // Ensure we have a valid event ID
    if (!event.id) {
      event.id = uuidv4();
    }
    
    // Ensure we have a timestamp
    if (!event.time) {
      event.time = new Date().toISOString();
    }
    
    // Add source if not present
    if (!event.source) {
      event.source = this.serviceName;
    }

    const message: ProducerRecord = {
      topic,
      messages: [
        {
          key: options.key || event.id,
          value: JSON.stringify(event),
          headers: options.headers || {},
          partition: options.partition,
        },
      ],
    };

    try {
      // Use circuit breaker pattern to prevent cascading failures
      return await this.circuitBreaker.fire(async () => {
        const result = await this.producer.send(message);
        this.logger.debug(`Produced message to ${topic}`, { messageId: event.id });
        return result[0].baseOffset;
      });
    } catch (error) {
      this.logger.error(`Failed to produce message to ${topic}`, { error, eventId: event.id });
      throw error;
    }
  }

  /**
   * Subscribe to a Kafka topic and process messages
   * @param topic The topic to subscribe to
   * @param handler The handler function to process messages
   * @param options Consumer options
   * @returns A function to stop consuming
   */
  async subscribe<T = any>(
    topic: string,
    handler: MessageHandler<T>,
    options: ConsumeOptions = {}
  ): Promise<() => Promise<void>> {
    const groupId = options.groupId || generateConsumerGroupId(this.serviceName, topic);
    
    const consumerConfig: ConsumerConfig = {
      groupId,
      allowAutoTopicCreation: false,
      sessionTimeout: options.sessionTimeout || 30000,
    };

    const consumer = this.kafka.consumer(consumerConfig);
    await consumer.connect();
    
    // Store consumer for cleanup later
    this.consumers.set(groupId, consumer);

    await consumer.subscribe({
      topic,
      fromBeginning: options.fromBeginning || false,
    });

    // Define a function to send messages to the DLQ when processing fails
    const sendToDlq = async (message: KafkaMessage, error: Error): Promise<void> => {
      if (!this.dlqEnabled) return;

      const dlqTopic = this.getDlqTopicName(topic);
      
      try {
        // Add error information to the original message
        const originalMessage = message.value 
          ? JSON.parse(message.value.toString()) 
          : {};
        
        const dlqMessage = {
          ...originalMessage,
          error: {
            message: error.message,
            stack: error.stack,
            time: new Date().toISOString()
          },
          processingService: this.serviceName,
          originalTopic: topic
        };
        
        await this.producer.send({
          topic: dlqTopic,
          messages: [
            {
              key: message.key,
              value: JSON.stringify(dlqMessage),
              headers: {
                ...message.headers,
                'error-message': error.message,
                'error-time': new Date().toISOString(),
                'original-topic': topic,
                'processing-service': this.serviceName
              }
            }
          ]
        });
        
        this.logger.info(`Sent failed message to DLQ ${dlqTopic}`, { 
          messageId: message.key?.toString(),
          error: error.message
        });
      } catch (dlqError) {
        this.logger.error(`Failed to send message to DLQ ${dlqTopic}`, { 
          messageId: message.key?.toString(),
          originalError: error.message,
          dlqError
        });
      }
    };

    // Process messages with automatic error handling and retry logic
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;
        const messageKey = message.key?.toString();
        
        try {
          this.logger.debug(`Processing message from ${topic}`, { 
            messageId: messageKey,
            partition
          });
          
          // Parse the message value
          let event: T;
          try {
            event = message.value ? JSON.parse(message.value.toString()) : null;
          } catch (parseError) {
            this.logger.error(`Failed to parse message from ${topic}`, { 
              messageId: messageKey,
              error: parseError.message
            });
            
            // Send unparseable message to DLQ
            await sendToDlq(message, parseError);
            return;
          }
          
          // Process the message with exponential backoff retry
          let retryCount = 0;
          const maxRetries = 3;
          
          while (true) {
            try {
              await handler(message, event, topic);
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              
              if (retryCount > maxRetries) {
                this.logger.error(`Failed to process message after ${maxRetries} retries`, {
                  topic,
                  messageId: messageKey,
                  error: error.message
                });
                
                // Send to DLQ after max retries
                await sendToDlq(message, error);
                break;
              }
              
              // Exponential backoff
              const backoffTime = Math.pow(2, retryCount) * 100; // 200ms, 400ms, 800ms
              this.logger.warn(`Retrying message processing (${retryCount}/${maxRetries})`, { 
                topic, messageId: messageKey, backoffMs: backoffTime 
              });
              
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
          }
        } catch (error) {
          this.logger.error(`Unhandled error processing message from ${topic}`, {
            messageId: messageKey,
            error: error.message,
            stack: error.stack
          });
          
          // Send to DLQ for unhandled errors
          await sendToDlq(message, error);
        }
      },
    });

    this.logger.info(`Subscribed to topic ${topic} with group ${groupId}`);

    // Return function to stop consuming
    return async (): Promise<void> => {
      await consumer.stop();
      await consumer.disconnect();
      this.consumers.delete(groupId);
      this.logger.info(`Unsubscribed from topic ${topic} with group ${groupId}`);
    };
  }

  /**
   * Consume messages from the DLQ for a specific topic
   * @param sourceTopic The original topic (DLQ will be derived)
   * @param handler The handler function to process messages
   * @param options Consumer options
   * @returns A function to stop consuming
   */
  async consumeDlq<T = any>(
    sourceTopic: string,
    handler: MessageHandler<T>,
    options: ConsumeOptions = {}
  ): Promise<() => Promise<void>> {
    const dlqTopic = this.getDlqTopicName(sourceTopic);
    return this.subscribe<T>(dlqTopic, handler, options);
  }

  /**
   * Create a Kafka topic (admin functionality)
   * @param topic Topic name
   * @param numPartitions Number of partitions
   * @param replicationFactor Replication factor
   */
  async createTopic(
    topic: string,
    numPartitions: number = 3,
    replicationFactor: number = 1
  ): Promise<void> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions,
            replicationFactor,
          },
        ],
      });
      this.logger.info(`Created topic ${topic}`);
    } finally {
      await admin.disconnect();
    }
  }

  /**
   * Get details about a topic's consumer groups
   * @param topic Topic name
   * @returns Consumer group information
   */
  async getConsumerGroupsForTopic(topic: string): Promise<any> {
    const admin = this.kafka.admin();
    
    try {
      await admin.connect();
      const groups = await admin.listGroups();
      const offsets = await Promise.all(
        groups.groups.map(async (group) => {
          try {
            const offsetsByGroup = await admin.fetchOffsets({
              groupId: group.groupId,
              topics: [topic],
            });
            return {
              groupId: group.groupId,
              offsets: offsetsByGroup,
            };
          } catch (err) {
            this.logger.error(`Error fetching offset for group ${group.groupId}`, err);
            return {
              groupId: group.groupId,
              error: err.message,
            };
          }
        })
      );
      
      return offsets.filter(offset => 
        offset.offsets && 
        offset.offsets.length > 0 && 
        offset.offsets[0].topic === topic
      );
    } finally {
      await admin.disconnect();
    }
  }
}

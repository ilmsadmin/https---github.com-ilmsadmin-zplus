# Message Broker Implementation for Multi-Tenant System

This document provides guidelines and instructions for implementing Kafka as the message broker for the multi-tenant system.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Installation and Setup](#installation-and-setup)
4. [Event Schema](#event-schema)
5. [Producer Implementation](#producer-implementation)
6. [Consumer Implementation](#consumer-implementation)
7. [Event Sourcing](#event-sourcing)
8. [Error Handling and DLQ](#error-handling-and-dlq)
9. [Monitoring and Management](#monitoring-and-management)
10. [Production Deployment](#production-deployment)
11. [Best Practices](#best-practices)

## Introduction

This implementation uses Apache Kafka as the message broker for asynchronous communication between microservices in the multi-tenant architecture. Kafka was chosen over RabbitMQ due to its:

- Superior throughput and scalability
- Natural fit for event sourcing with immutable log structure
- Stream processing capabilities
- Strong partitioning for tenant isolation
- Replay capabilities

## Architecture Overview

The message broker architecture includes:

- **Kafka Cluster**: Core messaging infrastructure with ZooKeeper for coordination
- **Schema Registry**: For managing and validating message schemas
- **Event Streams**: Well-defined topics for different domains (tenant, user, billing, etc.)
- **Event Store**: Implementation of event sourcing pattern
- **Dead Letter Queues (DLQ)**: For handling failed message processing
- **Shared Library**: For consistent interaction with Kafka across services

### Key Components

- **Producer Services**: Services that publish events to topics
- **Consumer Services**: Services that subscribe to topics and process events
- **Message Schemas**: Structured event definitions for data consistency
- **Event Store**: Database schema for persisting and querying events
- **Circuit Breaker**: Prevents cascading failures when Kafka is unavailable

## Installation and Setup

### Local Development Environment

#### Prerequisites

- Docker and Docker Compose
- Node.js v16+ and npm
- PowerShell 7+ (for Windows users)

#### Setup Steps

1. Start Kafka and related services:

```powershell
cd d:\www\multi-tenant\kafka
./manage-kafka.ps1 start
```

2. Verify the setup:

```powershell
./manage-kafka.ps1 status
```

3. Access Kafka UI at http://localhost:8080

### Available Management Commands

```powershell
# Start the Kafka cluster
./manage-kafka.ps1 start

# Stop the Kafka cluster
./manage-kafka.ps1 stop

# Check cluster status
./manage-kafka.ps1 status

# View logs
./manage-kafka.ps1 logs                     # All logs
./manage-kafka.ps1 logs -ServiceName kafka  # Only Kafka logs

# Create a new topic
./manage-kafka.ps1 create-topic -TopicName my-topic -Partitions 3 -ReplicationFactor 1

# List all topics
./manage-kafka.ps1 list-topics

# Start a console producer
./manage-kafka.ps1 producer -TopicName my-topic

# Start a console consumer
./manage-kafka.ps1 consumer -TopicName my-topic
```

## Event Schema

The event schema defines the structure of events published to Kafka. All events follow a common base structure with specific data payloads.

### Base Event Structure

```typescript
interface BaseEvent {
  id: string;             // Unique event identifier
  type: string;           // Event type (e.g., "tenant.created")
  source: string;         // Source service that generated the event
  time: string;           // ISO timestamp of when the event was generated
  dataVersion: string;    // Schema version for backward compatibility
  dataContentType: string; // Content type for serialization
  tenantId?: string;      // For tenant-specific events
  correlationId?: string; // For tracking related events
  causationId?: string;   // ID of the event that caused this event
  userId?: string;        // User who triggered the action
  data: any;              // The actual event payload
}
```

### Event Types

The system defines several event types grouped by domain:

1. **Tenant Events**:
   - `tenant.created`
   - `tenant.updated`
   - `tenant.suspended`
   - `tenant.activated`
   - `tenant.deleted`
   - `tenant.package_changed`

2. **User Events**:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `user.password_changed`
   - `user.role_assigned`
   - `user.mfa_enabled`
   - `user.mfa_disabled`
   - `user.login_succeeded`
   - `user.login_failed`
   - `user.locked`
   - `user.unlocked`

3. **Billing Events**:
   - `billing.invoice_created`
   - `billing.payment_succeeded`
   - `billing.payment_failed`
   - `billing.subscription_renewed`
   - `billing.subscription_cancelled`

4. **Notification Events**:
   - `notification.email_requested`
   - `notification.email_sent`
   - `notification.email_failed`
   - `notification.in_app_created`
   - `notification.in_app_read`

5. **File Events**:
   - `file.uploaded`
   - `file.downloaded`
   - `file.deleted`
   - `file.scanned`
   - `file.shared`

6. **Analytics Events**:
   - `analytics.user_activity_recorded`
   - `analytics.report_generated`
   - `analytics.metric_updated`

## Producer Implementation

The shared library makes it easy to implement producers in any service:

### Basic Producer Usage

```typescript
import { KafkaService, TenantEventType } from '@multi-tenant/event-bus';

// Initialize Kafka service
const kafkaService = new KafkaService('tenant-service', {
  clientId: 'tenant-service',
  brokers: ['kafka:9092']
});

// Connect to Kafka
await kafkaService.connect();

// Publish an event
await kafkaService.produce('tenant.events', {
  id: 'event-id-1',
  type: TenantEventType.CREATED,
  source: 'tenant-service',
  time: new Date().toISOString(),
  dataVersion: '1.0',
  dataContentType: 'application/json',
  data: {
    id: 'tenant-id-1',
    name: 'Acme Corporation',
    schemaName: 'acme',
    packageId: 'package-id-1',
    billingEmail: 'billing@acme.com',
    subscriptionStartDate: new Date().toISOString(),
    initialModules: ['crm', 'hrm']
  }
});
```

### NestJS Integration

For NestJS services, the library provides a module:

```typescript
// In your module file
import { KafkaModule } from '@multi-tenant/event-bus';

@Module({
  imports: [
    KafkaModule.register({
      serviceName: 'tenant-service',
      kafkaOptions: {
        clientId: 'tenant-service',
        brokers: ['kafka:9092']
      },
      eventStore: {
        enabled: true,
        topic: 'tenant.events'
      }
    })
  ]
})
export class AppModule {}

// In your service
import { NestKafkaService } from '@multi-tenant/event-bus';

@Injectable()
export class TenantService {
  constructor(private readonly kafkaService: NestKafkaService) {}
  
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    // Business logic to create tenant
    const tenant = await this.tenantRepository.create(data);
    
    // Publish event
    await this.kafkaService.getKafkaService().produce(
      'tenant.events',
      {
        id: uuidv4(),
        type: TenantEventType.CREATED,
        source: 'tenant-service',
        time: new Date().toISOString(),
        dataVersion: '1.0',
        dataContentType: 'application/json',
        data: {
          id: tenant.id,
          name: tenant.name,
          schemaName: tenant.schemaName,
          packageId: tenant.packageId,
          billingEmail: tenant.billingEmail,
          subscriptionStartDate: tenant.subscriptionStartDate,
          initialModules: tenant.modules.map(m => m.id)
        }
      }
    );
    
    return tenant;
  }
}
```

## Consumer Implementation

Consumers subscribe to topics and process incoming events:

### Basic Consumer Usage

```typescript
import { KafkaService } from '@multi-tenant/event-bus';

// Initialize Kafka service
const kafkaService = new KafkaService('notification-service', {
  clientId: 'notification-service',
  brokers: ['kafka:9092']
});

// Connect to Kafka
await kafkaService.connect();

// Subscribe to events
const stopConsumer = await kafkaService.subscribe(
  'tenant.events',
  async (message, event) => {
    console.log(`Processing ${event.type} event`);
    
    // Handle different event types
    switch (event.type) {
      case 'tenant.created':
        await handleTenantCreated(event.data);
        break;
      case 'tenant.suspended':
        await handleTenantSuspended(event.data);
        break;
      // Handle other event types
    }
  },
  {
    groupId: 'notification-service-tenant-consumer',
    fromBeginning: false
  }
);

// To stop consuming
await stopConsumer();
```

### NestJS Integration

For NestJS services, create a consumer class:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NestKafkaService } from '@multi-tenant/event-bus';

@Injectable()
export class TenantEventsConsumer implements OnModuleInit {
  constructor(private readonly kafkaService: NestKafkaService) {}

  async onModuleInit() {
    await this.kafkaService.subscribe(
      'tenant.events',
      async (message, event) => {
        // Handle the event
        switch (event.type) {
          case 'tenant.created':
            await this.handleTenantCreated(event);
            break;
          // Handle other event types
        }
      },
      { groupId: 'notification-service-tenant-consumer' }
    );
  }
  
  private async handleTenantCreated(event) {
    // Implementation
  }
}
```

## Event Sourcing

The event store enables rebuilding entity state from event streams:

### Database Schema

An SQL script is provided at `kafka/event-sourcing/event-store-schema.sql` that creates:

- `event_store` table for persisting events
- Helper functions for querying and rebuilding aggregates
- Snapshot support for optimizing large aggregate reconstruction

### Using Event Store in Application Code

```typescript
import { EventStore } from '@multi-tenant/event-bus';

// Initialize event store
const eventStore = new EventStore({
  kafkaService,
  eventStoreTopic: 'tenant.events'
});

// Save an event
await eventStore.saveEvent({
  id: 'event-id-1',
  type: 'tenant.created',
  // other event properties
});

// Subscribe to all events for event sourcing
await eventStore.subscribeToEventStore(
  async (event) => {
    // Process event for event sourcing
    // e.g., update read models or projections
  },
  { fromBeginning: true }
);
```

## Error Handling and DLQ

The library implements retry logic and dead letter queues:

### Retry Policy

1. Each message processing attempt that fails will be retried up to 3 times.
2. Retries use exponential backoff (200ms, 400ms, 800ms).
3. After maximum retries, the message is sent to a dead letter queue (DLQ).

### DLQ Management

Each topic has a corresponding DLQ topic with `.dlq` suffix:
- `tenant.events` → `tenant.events.dlq`
- `user.events` → `user.events.dlq`

### Processing DLQ Messages

```typescript
// Subscribe to DLQ messages
await kafkaService.consumeDlq(
  'tenant.events', // Original topic
  async (message, event) => {
    console.log('Processing failed message from DLQ');
    console.log('Original error:', event.error);
    
    // Custom recovery logic
    
    // If recovered, you could republish to the original topic
    if (recovered) {
      await kafkaService.produce('tenant.events', {
        // Fixed event data
      });
    }
  }
);
```

## Monitoring and Management

### Kafka UI

Access the Kafka UI at http://localhost:8080 for development, which provides:
- Topic management
- Consumer group monitoring
- Message browsing and publishing
- Schema registry management

### Monitoring with Prometheus and Grafana

For production environments, collect metrics using:
- JMX Exporter for Kafka metrics
- Prometheus for metrics collection
- Grafana for visualization

### Health Checks

Implement health checks for Kafka in each service:

```typescript
async checkKafkaHealth(): Promise<HealthCheckResult> {
  try {
    const admin = this.kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();
    
    return {
      status: 'up',
      details: {
        topicCount: topics.length
      }
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}
```

## Production Deployment

### Kubernetes Deployment

Use the provided Kubernetes manifests in `kafka/kubernetes/` for production deployment:

```bash
kubectl apply -f kafka/kubernetes/kafka-cluster.yaml
```

The manifests include:
- Highly available Kafka cluster (3 brokers)
- ZooKeeper ensemble (3 nodes)
- Schema Registry deployment (2 replicas)
- Persistent volume claims for data
- Topic initialization job

### Security Considerations

For production, enable:
1. **Authentication**: Configure SASL authentication
2. **Authorization**: Set up ACLs to control topic access
3. **Encryption**: Enable TLS for in-transit encryption
4. **Network Policies**: Restrict Kafka access to specific services

## Best Practices

1. **Idempotent Consumers**: Always design consumers to handle duplicate messages
2. **Event Versioning**: Include version in event schema and handle backward compatibility
3. **Correlation IDs**: Use correlation IDs to track related events across services
4. **Circuit Breakers**: Use circuit breakers to prevent cascading failures
5. **Consumer Group Naming**: Use consistent naming convention: `<service-name>-<purpose>-consumer`
6. **Partition Keys**: Use appropriate partition keys to ensure related events are processed in order
7. **Monitoring**: Monitor lag, throughput, and error rates of all consumers
8. **Dead Letter Handling**: Implement a strategy for DLQ message recovery
9. **Schema Evolution**: Plan for schema changes and versioning
10. **Testing**: Create thorough test cases for event producers and consumers

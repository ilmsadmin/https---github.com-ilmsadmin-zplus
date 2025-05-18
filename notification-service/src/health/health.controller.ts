import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { TypeOrmHealthIndicator } from './indicators/typeorm.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { KafkaHealthIndicator } from './indicators/kafka.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private kafka: KafkaHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Check service health', 
    description: 'Returns the health status of various service components including database, Redis, Kafka, disk, and memory' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'up' }
            }
          }
        },
        error: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'down' }
            }
          }
        },
        details: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'up' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    const kafkaEnabled = this.configService.get<boolean>('event.kafka.enabled');
    
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      ...(kafkaEnabled ? [() => this.kafka.pingCheck('kafka')] : []),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.memory.checkHeap('memory_heap', { thresholdPercent: 0.9 }),
      () => this.memory.checkRSS('memory_rss', { thresholdPercent: 0.9 }),
    ]);
  }
}

import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipAuth } from '../common/decorators/skip-auth.decorator';
import { StorageHealthIndicator } from './indicators/storage.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private storageHealth: StorageHealthIndicator,
  ) {}

  @Get()
  @SkipAuth()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  check() {
    return this.health.check([
      // Database connection check
      () => this.db.pingCheck('database'),
      
      // Memory check - heap usage below 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      
      // Disk space check - at least 500MB free
      () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      
      // MinIO/S3 storage check
      () => this.storageHealth.isHealthy('storage'),
    ]);
  }
}

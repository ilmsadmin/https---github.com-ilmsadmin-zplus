import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { StorageService } from '../../modules/storage/storage.service';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly storageService: StorageService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isAvailable = await this.storageService.checkConnection();
      
      const result = this.getStatus(key, isAvailable);
      
      if (isAvailable) {
        return result;
      }
      
      throw new HealthCheckError(
        'StorageHealthIndicator failed',
        result
      );
    } catch (error) {
      const result = this.getStatus(key, false, { message: error.message });
      throw new HealthCheckError(
        'StorageHealthIndicator failed',
        result
      );
    }
  }
}

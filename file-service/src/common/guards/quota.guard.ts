import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

interface QuotaData {
  totalStorage: number;
  usedStorage: number;
  remainingStorage: number;
  quotaPercentUsed: number;
}

@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly logger = new Logger(QuotaGuard.name);
  private quotaCache: Map<string, QuotaData> = new Map();
  private readonly cacheTTL = 60 * 1000; // 1 minute TTL for quota cache
  private readonly quotaCacheTimestamp: Map<string, number> = new Map();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipQuota = this.reflector.get<boolean>('skipQuota', context.getHandler());
    if (skipQuota) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    
    // Skip quota check if no tenant ID
    if (!tenantId) {
      return true;
    }

    try {
      const contentLength = parseInt(request.headers['content-length'] || '0', 10);
      
      // Skip quota check for small requests or non-upload requests
      if (contentLength < 1024 || request.method !== 'POST') {
        return true;
      }

      const quota = await this.getTenantQuota(tenantId);
      
      // Check if tenant has reached quota limit
      if (quota.remainingStorage < contentLength) {
        this.logger.warn(`Tenant ${tenantId} has reached storage quota limit. Used: ${quota.usedStorage}, Total: ${quota.totalStorage}`);
        throw new HttpException({
          status: HttpStatus.PAYMENT_REQUIRED,
          error: 'Storage quota exceeded',
          message: 'You have reached your storage quota limit. Please upgrade your plan or delete some files.',
          quota,
        }, HttpStatus.PAYMENT_REQUIRED);
      }

      // Warn if approaching quota limit (>90%)
      if (quota.quotaPercentUsed > 90) {
        this.logger.warn(`Tenant ${tenantId} is approaching storage quota limit (${quota.quotaPercentUsed.toFixed(2)}%)`);
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error checking quota for tenant ${tenantId}: ${error.message}`, error.stack);
      return true; // Allow request on error, better to allow than block incorrectly
    }
  }

  private async getTenantQuota(tenantId: string): Promise<QuotaData> {
    // Check cache first
    const now = Date.now();
    const cachedTimestamp = this.quotaCacheTimestamp.get(tenantId) || 0;
    
    if (now - cachedTimestamp < this.cacheTTL && this.quotaCache.has(tenantId)) {
      return this.quotaCache.get(tenantId);
    }

    try {
      // In a real implementation, this would call the tenant service or database
      // to get actual quota information. For now, we'll use a simplified approach.
      const defaultQuota = this.parseSize(
        this.configService.get<string>('quotas.defaultStorageQuota', '10GB')
      );
      
      // Simulate a database call to get used storage
      const usedStorage = await this.calculateUsedStorage(tenantId);
      
      const quota: QuotaData = {
        totalStorage: defaultQuota,
        usedStorage,
        remainingStorage: defaultQuota - usedStorage,
        quotaPercentUsed: (usedStorage / defaultQuota) * 100,
      };
      
      // Cache the result
      this.quotaCache.set(tenantId, quota);
      this.quotaCacheTimestamp.set(tenantId, now);
      
      return quota;
    } catch (error) {
      this.logger.error(`Error getting quota data for tenant ${tenantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async calculateUsedStorage(tenantId: string): Promise<number> {
    // This would typically query the database to sum the size of all files
    // For now, we'll return a random value for demonstration
    return Math.floor(Math.random() * 1000 * 1024 * 1024); // 0-1000 MB
  }

  private parseSize(sizeStr: string): number {
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    };
    
    const match = sizeStr.match(/^(\d+)([KMGT]?B)$/i);
    if (!match) {
      return 1024 * 1024 * 1024 * 10; // Default to 10GB if format is invalid
    }
    
    const size = parseInt(match[1], 10);
    const unit = match[2].toUpperCase();
    
    return size * (units[unit] || units.B);
  }
}

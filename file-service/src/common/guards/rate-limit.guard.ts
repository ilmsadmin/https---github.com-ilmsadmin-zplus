import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  endpoint: string;
  method: string;
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly limitByTenant: Map<string, Map<string, RateLimitState>> = new Map();
  private readonly limitByEndpoint: RateLimitConfig[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    // Initialize endpoint-specific rate limits
    this.initializeEndpointLimits();
  }

  private initializeEndpointLimits() {
    // These could be loaded from configuration
    this.limitByEndpoint.push(
      { endpoint: '/files', method: 'POST', limit: 20, windowMs: 60 * 1000 }, // 20 uploads per minute
      { endpoint: '/files/bulk', method: 'POST', limit: 5, windowMs: 60 * 1000 }, // 5 bulk uploads per minute
      { endpoint: '/files', method: 'GET', limit: 100, windowMs: 60 * 1000 }, // 100 list requests per minute
      { endpoint: '/shares', method: 'POST', limit: 50, windowMs: 60 * 1000 }, // 50 shares per minute
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipRateLimit = this.reflector.get<boolean>('skipRateLimit', context.getHandler());
    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { tenantId, originalUrl, method } = request;
    
    if (!tenantId) {
      // Skip rate limiting for requests without tenant context
      return true;
    }
    
    try {
      // Get the request endpoint (first part of the path)
      const endpoint = originalUrl.split('?')[0];
      
      // Get the rate limit for this endpoint
      const rateLimit = this.getRateLimitForEndpoint(endpoint, method);
      if (!rateLimit) {
        // No specific rate limit for this endpoint
        return true;
      }
      
      // Check if tenant has exceeded the rate limit
      const limitExceeded = this.checkAndUpdateRateLimit(
        tenantId, 
        `${method}:${endpoint}`,
        rateLimit.limit,
        rateLimit.windowMs
      );
      
      if (limitExceeded) {
        const resetIn = this.getResetTimeInSeconds(tenantId, `${method}:${endpoint}`);
        
        // Add rate limit headers to response
        const response = context.switchToHttp().getResponse();
        response.header('X-RateLimit-Limit', rateLimit.limit);
        response.header('X-RateLimit-Remaining', 0);
        response.header('X-RateLimit-Reset', resetIn);
        
        this.logger.warn(`Rate limit exceeded for tenant ${tenantId} on ${method} ${endpoint}`);
        
        throw new HttpException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
        }, HttpStatus.TOO_MANY_REQUESTS);
      }
      
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      // If it's any other error, log it but don't block the request
      this.logger.error(`Error in RateLimitGuard: ${error.message}`, error.stack);
      return true;
    }
  }
  
  private getRateLimitForEndpoint(endpoint: string, method: string): RateLimitConfig {
    // Find a matching endpoint-specific limit
    for (const limit of this.limitByEndpoint) {
      if (endpoint.startsWith(limit.endpoint) && limit.method === method) {
        return limit;
      }
    }
    
    // No specific limit found
    return null;
  }
  
  private checkAndUpdateRateLimit(
    tenantId: string,
    key: string,
    limit: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    
    // Get or create tenant's rate limit map
    if (!this.limitByTenant.has(tenantId)) {
      this.limitByTenant.set(tenantId, new Map<string, RateLimitState>());
    }
    
    const tenantLimits = this.limitByTenant.get(tenantId);
    
    // Get or create state for this endpoint
    if (!tenantLimits.has(key) || tenantLimits.get(key).resetAt < now) {
      tenantLimits.set(key, {
        count: 0,
        resetAt: now + windowMs,
      });
    }
    
    // Update counter
    const state = tenantLimits.get(key);
    state.count += 1;
    
    // Check if limit exceeded
    return state.count > limit;
  }
  
  private getResetTimeInSeconds(tenantId: string, key: string): number {
    if (!this.limitByTenant.has(tenantId) || !this.limitByTenant.get(tenantId).has(key)) {
      return 0;
    }
    
    const state = this.limitByTenant.get(tenantId).get(key);
    const now = Date.now();
    
    return Math.max(0, Math.ceil((state.resetAt - now) / 1000));
  }
}

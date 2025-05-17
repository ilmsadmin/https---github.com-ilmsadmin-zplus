import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    // Extract tenant from request (could be from subdomain, headers, etc.)
    const tenantId = this.extractTenantId(request);
    
    // If no tenant in request, it might be a system level endpoint
    if (!tenantId) {
      // Check if this endpoint is marked as system-level
      const isSystemEndpoint = this.reflector.get<boolean>('isSystemEndpoint', context.getHandler());
      
      if (isSystemEndpoint) {
        // Ensure user has system-level access
        return user.role === 'system_admin' || user.role === 'system_manager';
      }
      
      // If not a system endpoint, require tenant context
      throw new UnauthorizedException('Tenant context is required');
    }
    
    // Verify that user belongs to the requested tenant
    if (user.tenant_id !== tenantId) {
      throw new UnauthorizedException('User does not belong to this tenant');
    }
    
    return true;
  }

  private extractTenantId(request: any): string | null {
    // Extract from headers
    const tenantId = request.headers['x-tenant-id'];
    if (tenantId) {
      return tenantId;
    }
    
    // Extract from hostname (e.g., tenant-name.example.com)
    const hostname = request.headers.host;
    if (hostname && hostname.includes('.')) {
      const subdomain = hostname.split('.')[0];
      // Here you would lookup the tenant_id by subdomain (schema_name)
      // For now, just return null
      return null;
    }
    
    return null;
  }
}

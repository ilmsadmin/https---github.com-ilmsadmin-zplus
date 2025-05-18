import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantAuthGuard implements CanActivate {
  private readonly logger = new Logger(TenantAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant ID from headers or token
    // In a real implementation, this would validate the JWT token or session
    const tenantId = request.headers['x-tenant-id'];
    const userId = request.headers['x-user-id'];
    
    if (!tenantId) {
      this.logger.warn('Request missing tenant ID');
      throw new UnauthorizedException('Missing tenant context');
    }
    
    // Attach tenant context to request for use by the TenantContext decorator
    request.tenantId = tenantId;
    if (userId) {
      request.userId = userId;
    }
    
    // In a real app, we would also fetch and attach roles/permissions
    
    return true;
  }
}

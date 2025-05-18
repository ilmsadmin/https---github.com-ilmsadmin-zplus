import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    
    // Extract tenant from hostname if not provided in headers
    if (!tenantId) {
      const hostname = request.headers.host;
      
      if (hostname && hostname.includes('.')) {
        // Extract subdomain from hostname (e.g., tenant1.example.com -> tenant1)
        const subdomain = hostname.split('.')[0];
        
        if (subdomain && subdomain !== 'www' && !['localhost', '127.0.0.1'].includes(subdomain)) {
          request.tenantId = subdomain;
        }
      }
    } else {
      request.tenantId = tenantId;
    }
    
    return next.handle();
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { TenantContext } from '../interfaces/tenant-context.interface';

export const TenantIdFromReq = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { tenantContext?: TenantContext }>();
    
    // Return the tenant ID from the tenant context
    if (request.tenantContext && request.tenantContext.tenantId) {
      return request.tenantContext.tenantId;
    }
    
    // Fallback to header if middleware not applied
    return request.headers['x-tenant-id'] as string;
  },
);

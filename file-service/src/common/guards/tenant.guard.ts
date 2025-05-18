import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_KEY } from '../decorators/tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresTenant = this.reflector.getAllAndOverride<boolean>(
      TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If tenant context is not required, skip validation
    if (!requiresTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { tenantId } = request;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    // Validate tenant ID format (you can add more specific validation here)
    if (typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new ForbiddenException('Invalid tenant context');
    }

    return true;
  }
}

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ITenantContext } from '../interfaces/tenant-context.interface';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant information from headers
    const tenantId = req.headers['x-tenant-id'] as string;
    const schemaName = req.headers['x-schema-name'] as string;
    
    if (!tenantId || !schemaName) {
      throw new UnauthorizedException('Tenant context is missing');
    }
    
    // Create tenant context
    const tenantContext: ITenantContext = {
      tenantId,
      schemaName,
      userId: req.headers['x-user-id'] as string,
    };
    
    // Attach to request
    req['tenantContext'] = tenantContext;
    
    next();
  }
}

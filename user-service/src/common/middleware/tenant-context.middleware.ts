import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const schemaName = req.headers['x-schema-name'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (!tenantId || !schemaName) {
      throw new BadRequestException('Tenant context is required');
    }
    
    req['tenantContext'] = { tenantId, schemaName, userId };
    next();
  }
}

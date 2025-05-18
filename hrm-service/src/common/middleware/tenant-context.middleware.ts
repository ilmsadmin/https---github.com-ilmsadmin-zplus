import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from headers, JWT token, or query params
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      this.logger.warn('Request missing tenant ID');
      return res.status(401).json({
        statusCode: 401,
        message: 'Missing tenant context',
      });
    }
    
    // Attach tenant context to request for use by controllers
    req['tenantId'] = tenantId;
    
    // If there's a JWT with user info, extract and attach user context too
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real app, you would decode the JWT token here
      // For now, we'll just use the x-user-id header if present
      const userId = req.headers['x-user-id'] as string;
      if (userId) {
        req['userId'] = userId;
      }
    }
    
    next();
  }
}

// Export a functional middleware for use in main.ts
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const middleware = new TenantContextMiddleware();
  middleware.use(req, res, next);
}

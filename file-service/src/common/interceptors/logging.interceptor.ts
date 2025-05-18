import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const tenantId = headers['x-tenant-id'] || 'unknown';
    
    const now = Date.now();
    const requestId = headers['x-request-id'] || `req-${now}-${Math.floor(Math.random() * 1000)}`;
    
    request.requestId = requestId;
    
    this.logger.log(
      `[${requestId}] [Tenant: ${tenantId}] ${method} ${url} - User-Agent: ${userAgent} - IP: ${ip}`,
    );
    
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(
        `[${requestId}] Request Body: ${JSON.stringify(sanitizedBody)}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: (val) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `[${requestId}] [Tenant: ${tenantId}] ${method} ${url} - Completed in ${responseTime}ms`,
          );
        },
        error: (err) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `[${requestId}] [Tenant: ${tenantId}] ${method} ${url} - Error: ${err.message} - Completed in ${responseTime}ms`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'accessKey', 'secretKey'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }
    
    return sanitized;
  }
}

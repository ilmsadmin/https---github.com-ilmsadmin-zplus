import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'File Service',
      version: '1.0.0',
      description: 'File management service for multi-tenant application',
      status: 'running',
    };
  }
}

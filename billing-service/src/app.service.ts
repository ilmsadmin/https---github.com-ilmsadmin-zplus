import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { status: string; message: string; timestamp: Date } {
    return {
      status: 'online',
      message: 'Billing service is running',
      timestamp: new Date(),
    };
  }
}

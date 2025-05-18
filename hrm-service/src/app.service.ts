import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    return {
      status: 'ok',
      service: this.configService.get<string>('app.name'),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

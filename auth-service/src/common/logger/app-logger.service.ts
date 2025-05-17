import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(private configService: ConfigService) {}

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: any, context?: string) {
    context = context || this.context;
    
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }
    
    console.log(`[${this.getTimestamp()}] [${context}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    context = context || this.context;
    
    console.error(`[${this.getTimestamp()}] [${context}] ${message}`);
    if (trace) {
      console.error(`${trace}`);
    }
  }

  warn(message: any, context?: string) {
    context = context || this.context;
    
    console.warn(`[${this.getTimestamp()}] [${context}] ${message}`);
  }

  debug(message: any, context?: string) {
    // Only log debug messages in development
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      return;
    }
    
    context = context || this.context;
    
    console.debug(`[${this.getTimestamp()}] [${context}] ${message}`);
  }

  verbose(message: any, context?: string) {
    // Only log verbose messages in development
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      return;
    }
    
    context = context || this.context;
    
    console.log(`[${this.getTimestamp()}] [${context}] ${message}`);
  }

  private getTimestamp() {
    return new Date().toISOString();
  }
}

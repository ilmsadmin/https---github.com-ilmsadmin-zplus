import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { StorageHealthIndicator } from './indicators/storage.health';
import { StorageModule } from '../modules/storage/storage.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [StorageHealthIndicator],
})
export class HealthModule {}

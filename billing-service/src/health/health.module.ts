import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator } from './indicators/typeorm.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    TypeOrmModule,
  ],
  controllers: [HealthController],
  providers: [TypeOrmHealthIndicator],
})
export class HealthModule {}

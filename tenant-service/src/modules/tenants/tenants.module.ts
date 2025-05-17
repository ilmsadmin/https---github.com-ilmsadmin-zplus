import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant } from './entities/tenant.entity';
import { Domain } from '../domains/entities/domain.entity';
import { TenantModule } from '../tenant-modules/entities/tenant-module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Domain, TenantModule]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenantModule as TenantModuleEntity } from './entities/tenant-module.entity';
import { TenantModulesService } from './tenant-modules.service';
import { TenantModulesController } from './tenant-modules.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantModuleEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [TenantModulesController],
  providers: [TenantModulesService],
  exports: [TenantModulesService],
})
export class TenantModulesModule {}

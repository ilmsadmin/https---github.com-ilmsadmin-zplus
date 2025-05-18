import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompatibilityCheckService } from './compatibility-check.service';
import { CompatibilityCheckController } from './compatibility-check.controller';
import { ModuleDependency } from '../module-dependencies/entities/module-dependency.entity';
import { ModuleVersion } from '../module-versions/entities/module-version.entity';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleInstallation } from '../module-installations/entities/module-installation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleDependency,
      ModuleVersion,
      ModuleEntity,
      ModuleInstallation,
    ]),
  ],
  providers: [CompatibilityCheckService],
  controllers: [CompatibilityCheckController],
  exports: [CompatibilityCheckService],
})
export class CompatibilityCheckModule {}

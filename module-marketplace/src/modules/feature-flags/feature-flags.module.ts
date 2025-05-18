import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { ModuleFeatureFlag } from './entities/module-feature-flag.entity';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleInstallation } from '../module-installations/entities/module-installation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleFeatureFlag,
      ModuleEntity,
      ModuleInstallation,
    ]),
  ],
  providers: [FeatureFlagsService],
  controllers: [FeatureFlagsController],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}

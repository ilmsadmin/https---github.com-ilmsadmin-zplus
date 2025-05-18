import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleDependency } from './entities/module-dependency.entity';
import { ModuleDependenciesService } from './module-dependencies.service';
import { ModuleDependenciesController } from './module-dependencies.controller';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleVersion } from '../module-versions/entities/module-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleDependency,
      ModuleEntity,
      ModuleVersion,
    ]),
  ],
  providers: [ModuleDependenciesService],
  controllers: [ModuleDependenciesController],
  exports: [ModuleDependenciesService],
})
export class ModuleDependenciesModule {}

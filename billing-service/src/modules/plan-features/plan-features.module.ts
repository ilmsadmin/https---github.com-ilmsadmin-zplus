import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PlanFeature } from './entities/plan-feature.entity';
import { PlanFeaturesService } from './plan-features.service';
import { PlanFeaturesController } from './plan-features.controller';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanFeature]),
    EventEmitterModule.forRoot(),
    PlansModule,
  ],
  controllers: [PlanFeaturesController],
  providers: [PlanFeaturesService],
  exports: [PlanFeaturesService],
})
export class PlanFeaturesModule {}

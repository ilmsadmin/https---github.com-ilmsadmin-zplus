import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './services/settings.service';
import { SettingsController } from './controllers/settings.controller';
import { UserSetting } from './entities/user-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSetting]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

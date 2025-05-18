import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InAppService } from './in-app.service';
import { InAppNotification } from './entities/in-app-notification.entity';
import { TenantsModule } from '../../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InAppNotification]),
    TenantsModule,
  ],
  providers: [InAppService],
  exports: [InAppService],
})
export class InAppModule {}

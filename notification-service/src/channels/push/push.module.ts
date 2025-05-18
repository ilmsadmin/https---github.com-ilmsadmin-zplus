import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { TenantsModule } from '../../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}

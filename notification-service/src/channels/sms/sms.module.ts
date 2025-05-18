import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { TenantsModule } from '../../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}

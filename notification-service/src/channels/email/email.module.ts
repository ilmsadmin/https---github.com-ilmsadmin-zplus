import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TenantsModule } from '../../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

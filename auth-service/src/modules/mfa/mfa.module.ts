import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { SystemUser } from '../users/entities/system-user.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemUser, Tenant], 'system'),
    AuthModule,
  ],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemUser } from './entities/system-user.entity';
import { Tenant } from './entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemUser, Tenant], 'system'),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class UsersModule {}

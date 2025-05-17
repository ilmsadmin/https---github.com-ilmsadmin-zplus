import { Module } from '@nestjs/common';
import { BulkController } from './controllers/bulk.controller';
import { BulkService } from './services/bulk.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [BulkController],
  providers: [BulkService],
})
export class BulkModule {}

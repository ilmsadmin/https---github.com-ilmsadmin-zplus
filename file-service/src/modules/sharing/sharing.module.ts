import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileShareEntity } from './entities/file-share.entity';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';
import { FilesModule } from '../files/files.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileShareEntity]),
    FilesModule,
    SecurityModule,
  ],
  controllers: [SharingController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}

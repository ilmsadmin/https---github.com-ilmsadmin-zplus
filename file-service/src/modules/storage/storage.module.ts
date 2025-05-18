import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { MinioStorageProvider } from './providers/minio-storage.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    StorageService,
    S3StorageProvider,
    MinioStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}

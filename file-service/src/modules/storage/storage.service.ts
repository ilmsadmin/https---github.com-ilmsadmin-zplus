import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { MinioStorageProvider } from './providers/minio-storage.provider';
import { StorageProviderInterface } from './interfaces/storage-provider.interface';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements StorageProviderInterface {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProviderInterface;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Provider: S3StorageProvider,
    private readonly minioProvider: MinioStorageProvider,
  ) {
    // Select provider based on configuration
    const providerType = this.configService.get<string>('storage.provider', 'minio');
    
    if (providerType === 's3') {
      this.provider = this.s3Provider;
      this.logger.log('Using AWS S3 storage provider');
    } else {
      this.provider = this.minioProvider;
      this.logger.log('Using MinIO storage provider');
    }
  }

  async checkConnection(): Promise<boolean> {
    return this.provider.checkConnection();
  }

  async createBucket(bucketName: string): Promise<void> {
    return this.provider.createBucket(bucketName);
  }

  async getBucketPolicy(bucketName: string): Promise<any> {
    return this.provider.getBucketPolicy(bucketName);
  }

  async setBucketPolicy(bucketName: string, policy: any): Promise<void> {
    return this.provider.setBucketPolicy(bucketName, policy);
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return this.provider.bucketExists(bucketName);
  }

  async listBuckets(): Promise<string[]> {
    return this.provider.listBuckets();
  }

  async deleteBucket(bucketName: string): Promise<void> {
    return this.provider.deleteBucket(bucketName);
  }

  async uploadFile(
    bucketName: string,
    objectPath: string,
    data: Buffer | Readable,
    metadata?: Record<string, string>,
  ): Promise<void> {
    return this.provider.uploadFile(bucketName, objectPath, data, metadata);
  }

  async downloadFile(bucketName: string, objectPath: string): Promise<Buffer> {
    return this.provider.downloadFile(bucketName, objectPath);
  }

  async getFileStream(bucketName: string, objectPath: string): Promise<Readable> {
    return this.provider.getFileStream(bucketName, objectPath);
  }

  async getFileMetadata(bucketName: string, objectPath: string): Promise<Record<string, string>> {
    return this.provider.getFileMetadata(bucketName, objectPath);
  }

  async deleteFile(bucketName: string, objectPath: string): Promise<void> {
    return this.provider.deleteFile(bucketName, objectPath);
  }

  async listFiles(bucketName: string, prefix?: string): Promise<{ name: string; size: number; lastModified: Date }[]> {
    return this.provider.listFiles(bucketName, prefix);
  }

  async fileExists(bucketName: string, objectPath: string): Promise<boolean> {
    return this.provider.fileExists(bucketName, objectPath);
  }

  async copyFile(sourceBucket: string, sourceKey: string, destinationBucket: string, destinationKey: string): Promise<void> {
    return this.provider.copyFile(sourceBucket, sourceKey, destinationBucket, destinationKey);
  }

  async getPresignedUrl(bucketName: string, objectPath: string, expiresIn: number = 3600): Promise<string> {
    return this.provider.getPresignedUrl(bucketName, objectPath, expiresIn);
  }

  async getSignedPutUrl(bucketName: string, objectPath: string, expiresIn: number = 3600, contentType?: string): Promise<string> {
    return this.provider.getSignedPutUrl(bucketName, objectPath, expiresIn, contentType);
  }

  getTenantBucketName(tenantId: string): string {
    const bucketPrefix = this.configService.get<string>('storage.bucketPrefix', 'tenant-');
    return `${bucketPrefix}${tenantId}`;
  }
}

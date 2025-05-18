import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { StorageProviderInterface } from '../interfaces/storage-provider.interface';
import { 
  S3Client, 
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadBucketCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MinioStorageProvider implements StorageProviderInterface {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('storage.endpoint');
    const port = this.configService.get<number>('storage.port');
    const useSsl = this.configService.get<boolean>('storage.useSsl');
    
    this.client = new S3Client({
      region: this.configService.get<string>('storage.region', 'us-east-1'),
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKey'),
        secretAccessKey: this.configService.get<string>('storage.secretKey'),
      },
      forcePathStyle: true,
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.client.send(new ListBucketsCommand({}));
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to MinIO: ${error.message}`);
      return false;
    }
  }

  async createBucket(bucketName: string): Promise<void> {
    try {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        }),
      );
    } catch (error) {
      // If the bucket already exists, MinIO returns an error
      if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
        return;
      }
      this.logger.error(`Failed to create bucket ${bucketName}: ${error.message}`);
      throw error;
    }
  }

  async getBucketPolicy(bucketName: string): Promise<any> {
    try {
      const response = await this.client.send(
        new GetBucketPolicyCommand({
          Bucket: bucketName,
        }),
      );
      return JSON.parse(response.Policy);
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        return null;
      }
      this.logger.error(`Failed to get bucket policy for ${bucketName}: ${error.message}`);
      throw error;
    }
  }

  async setBucketPolicy(bucketName: string, policy: any): Promise<void> {
    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(policy),
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to set bucket policy for ${bucketName}: ${error.message}`);
      throw error;
    }
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchBucket') {
        return false;
      }
      this.logger.error(`Error checking if bucket ${bucketName} exists: ${error.message}`);
      throw error;
    }
  }

  async listBuckets(): Promise<string[]> {
    try {
      const response = await this.client.send(new ListBucketsCommand({}));
      return (response.Buckets || []).map((bucket) => bucket.Name);
    } catch (error) {
      this.logger.error(`Failed to list buckets: ${error.message}`);
      throw error;
    }
  }

  async deleteBucket(bucketName: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteBucketCommand({
          Bucket: bucketName,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete bucket ${bucketName}: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(
    bucketName: string,
    objectPath: string,
    data: Buffer | Readable,
    metadata?: Record<string, string>,
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
          Body: data,
          Metadata: metadata,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to upload file to ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(bucketName: string, objectPath: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
        }),
      );

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body as Readable) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to download file from ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async getFileStream(bucketName: string, objectPath: string): Promise<Readable> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
        }),
      );
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to get file stream from ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async getFileMetadata(bucketName: string, objectPath: string): Promise<Record<string, string>> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
        }),
      );
      return response.Metadata || {};
    } catch (error) {
      this.logger.error(`Failed to get file metadata from ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectPath: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete file from ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async listFiles(bucketName: string, prefix?: string): Promise<{ name: string; size: number; lastModified: Date }[]> {
    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
        }),
      );

      return (response.Contents || []).map((item) => ({
        name: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucketName}/${prefix || ''}: ${error.message}`);
      throw error;
    }
  }

  async fileExists(bucketName: string, objectPath: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectPath,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      this.logger.error(`Error checking if file ${bucketName}/${objectPath} exists: ${error.message}`);
      throw error;
    }
  }

  async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
  ): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          CopySource: `${sourceBucket}/${sourceKey}`,
          Bucket: destinationBucket,
          Key: destinationKey,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to copy file from ${sourceBucket}/${sourceKey} to ${destinationBucket}/${destinationKey}: ${error.message}`,
      );
      throw error;
    }
  }

  async getPresignedUrl(bucketName: string, objectPath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectPath,
      });

      return getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }

  async getSignedPutUrl(
    bucketName: string,
    objectPath: string,
    expiresIn: number = 3600,
    contentType?: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectPath,
        ContentType: contentType,
      });

      return getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate signed PUT URL for ${bucketName}/${objectPath}: ${error.message}`);
      throw error;
    }
  }
}

import { Readable } from 'stream';

export interface StorageProviderInterface {
  checkConnection(): Promise<boolean>;
  
  createBucket(bucketName: string): Promise<void>;
  
  getBucketPolicy(bucketName: string): Promise<any>;
  
  setBucketPolicy(bucketName: string, policy: any): Promise<void>;
  
  bucketExists(bucketName: string): Promise<boolean>;
  
  listBuckets(): Promise<string[]>;
  
  deleteBucket(bucketName: string): Promise<void>;
  
  uploadFile(
    bucketName: string,
    objectPath: string,
    data: Buffer | Readable,
    metadata?: Record<string, string>,
  ): Promise<void>;
  
  downloadFile(bucketName: string, objectPath: string): Promise<Buffer>;
  
  getFileStream(bucketName: string, objectPath: string): Promise<Readable>;
  
  getFileMetadata(bucketName: string, objectPath: string): Promise<Record<string, string>>;
  
  deleteFile(bucketName: string, objectPath: string): Promise<void>;
  
  listFiles(bucketName: string, prefix?: string): Promise<{ name: string; size: number; lastModified: Date }[]>;
  
  fileExists(bucketName: string, objectPath: string): Promise<boolean>;
  
  copyFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
  ): Promise<void>;
  
  getPresignedUrl(
    bucketName: string,
    objectPath: string,
    expiresIn?: number,
  ): Promise<string>;
  
  getSignedPutUrl(
    bucketName: string,
    objectPath: string,
    expiresIn?: number,
    contentType?: string,
  ): Promise<string>;
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Get the master encryption key from config
    const encryptionKey = this.configService.get<string>('security.encryptionKey');
    
    // Derive a key using PBKDF2
    this.masterKey = crypto.pbkdf2Sync(
      encryptionKey,
      'salt-for-master-key',
      10000,
      32,
      'sha256',
    );
  }

  /**
   * Generate a new encryption key for a file
   */
  async generateEncryptionKey(): Promise<string> {
    try {
      // Generate a random key
      const fileKey = crypto.randomBytes(32).toString('hex');
      return fileKey;
    } catch (error) {
      this.logger.error(`Failed to generate encryption key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encrypt data using the provided key
   */
  async encrypt(data: Buffer, fileKey: string): Promise<{ encryptedData: Buffer; iv: string; authTag: string }> {
    try {
      // Generate initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(fileKey, 'hex'), iv);
      
      // Encrypt data
      const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      return {
        encryptedData,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      this.logger.error(`Failed to encrypt data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypt data using the provided key, IV, and auth tag
   */
  async decrypt(encryptedData: Buffer, fileKey: string, iv: string, authTag: string): Promise<Buffer> {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(fileKey, 'hex'),
        Buffer.from(iv, 'hex'),
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt data
      const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      
      return decryptedData;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encrypt a file encryption key with master key for secure storage
   */
  encryptFileKey(fileKey: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      const encrypted = Buffer.concat([cipher.update(Buffer.from(fileKey, 'hex')), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // Return as base64 string: iv + authTag + encrypted data
      return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    } catch (error) {
      this.logger.error(`Failed to encrypt file key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypt a file encryption key with master key
   */
  decryptFileKey(encryptedKey: string): string {
    try {
      const data = Buffer.from(encryptedKey, 'base64');
      
      // Extract parts
      const iv = data.slice(0, 16);
      const authTag = data.slice(16, 32);
      const encrypted = data.slice(32);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      
      return decrypted.toString('hex');
    } catch (error) {
      this.logger.error(`Failed to decrypt file key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hash a string (e.g., for password hashing)
   */
  hashString(input: string, salt?: string): string {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(input, useSalt, 10000, 64, 'sha512').toString('hex');
    return `${useSalt}:${hash}`;
  }

  /**
   * Verify a string against a hash
   */
  verifyHash(input: string, storedHash: string): boolean {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(input, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }

  /**
   * Generate a hash of a file's content
   */
  async generateContentHash(data: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

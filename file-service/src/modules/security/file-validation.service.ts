import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fileType from 'file-type';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

const readFileAsync = util.promisify(fs.readFile);

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);
  private readonly allowedTypes: string[];
  private readonly maxFileSize: number;

  constructor(private readonly configService: ConfigService) {
    this.allowedTypes = this.configService.get<string[]>('file.allowedTypes', []);
    this.maxFileSize = this.configService.get<number>('file.maxSize', 104857600); // 100MB default
  }

  /**
   * Validates a file based on its type, size, and content
   */
  async validateFile(
    file: Express.Multer.File,
    allowedTypes?: string[],
    maxSize?: number,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const typesToCheck = allowedTypes || this.allowedTypes;
    const sizeLimit = maxSize || this.maxFileSize;

    // Step 1: Validate file size
    if (file.size > sizeLimit) {
      errors.push(`File size exceeds the limit of ${sizeLimit / (1024 * 1024)} MB`);
    }

    // Step 2: Validate file type
    if (!this.validateMimeType(file.mimetype, typesToCheck)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Step 3: Validate file content using file-type library
    try {
      const detectedType = await this.detectFileType(file.path);
      
      if (detectedType) {
        const declaredExt = path.extname(file.originalname).toLowerCase().substring(1);
        const detectedExt = detectedType.ext;
        const detectedMime = detectedType.mime;
        
        // Check if detected MIME type matches the declared MIME type
        if (detectedMime !== file.mimetype) {
          errors.push(`Detected MIME type (${detectedMime}) does not match declared type (${file.mimetype})`);
        }
        
        // Check if file extension matches detected file type
        if (declaredExt !== detectedExt) {
          errors.push(`File extension (.${declaredExt}) does not match actual content type (.${detectedExt})`);
        }
        
        // Check if detected MIME type is allowed
        if (!this.validateMimeType(detectedMime, typesToCheck)) {
          errors.push(`Detected file type ${detectedMime} is not allowed`);
        }
      }
    } catch (error) {
      this.logger.error(`Error validating file content: ${error.message}`);
      errors.push('Error validating file content');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect file type based on content signatures
   */
  private async detectFileType(filePath: string): Promise<{ ext: string; mime: string } | null> {
    try {
      // Read file head (first 4100 bytes should be enough for most file signatures)
      const buffer = await readFileAsync(filePath, { flag: 'r' });
      
      // Use file-type library to detect type from buffer
      const type = await fileType.fromBuffer(buffer);
      
      return type;
    } catch (error) {
      this.logger.error(`Error detecting file type: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate mime type against allowed types
   */
  private validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType) || allowedTypes.includes('*');
  }
}

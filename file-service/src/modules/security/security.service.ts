import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationService } from './file-validation.service';
import { VirusScanService } from './virus-scan.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fileValidationService: FileValidationService,
    private readonly virusScanService: VirusScanService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Validates and scans a file for security threats
   */
  async validateAndScanFile(
    file: Express.Multer.File,
    allowedTypes?: string[],
    maxSize?: number,
  ): Promise<{
    isValid: boolean;
    isVirus: boolean;
    validationErrors?: string[];
    encryptionKey?: string;
  }> {
    this.logger.log(`Validating and scanning file: ${file.originalname}`);
    
    const result = {
      isValid: true,
      isVirus: false,
      validationErrors: [],
      encryptionKey: null,
    };

    // Step 1: Validate file type and size
    const validationResult = await this.fileValidationService.validateFile(
      file,
      allowedTypes,
      maxSize,
    );

    if (!validationResult.isValid) {
      result.isValid = false;
      result.validationErrors = validationResult.errors;
      return result;
    }

    // Step 2: Scan for viruses if enabled
    if (this.configService.get<boolean>('file.enableVirusScan')) {
      try {
        const scanResult = await this.virusScanService.scanFile(file.path);
        result.isVirus = scanResult.isVirus;
        
        if (scanResult.isVirus) {
          result.validationErrors.push('Virus or malware detected in the file');
          result.isValid = false;
        }
      } catch (error) {
        this.logger.error(`Virus scan failed: ${error.message}`);
        // Don't block the upload if the virus scanner fails, but log the error
      }
    }

    // Step 3: Encrypt file if needed
    if (result.isValid && this.shouldEncryptFile(file.mimetype)) {
      try {
        const encryptionKey = await this.encryptionService.generateEncryptionKey();
        result.encryptionKey = encryptionKey;
      } catch (error) {
        this.logger.error(`Failed to generate encryption key: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Determines if a file should be encrypted based on its type
   */
  private shouldEncryptFile(mimeType: string): boolean {
    // Encrypt sensitive document types
    const sensitiveTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    return sensitiveTypes.includes(mimeType);
  }
}

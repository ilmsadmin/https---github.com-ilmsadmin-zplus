import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { FileValidationService } from './file-validation.service';
import { VirusScanService } from './virus-scan.service';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SecurityService,
    FileValidationService,
    VirusScanService,
    EncryptionService,
  ],
  exports: [
    SecurityService,
    FileValidationService,
    VirusScanService,
    EncryptionService,
  ],
})
export class SecurityModule {}

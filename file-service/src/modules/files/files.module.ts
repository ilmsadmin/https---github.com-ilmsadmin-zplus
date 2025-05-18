import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import { FileEntity } from './entities/file.entity';
import { FileVersionEntity } from './entities/file-version.entity';
import { FileTagEntity } from './entities/file-tag.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageModule } from '../storage/storage.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FileEntity,
      FileVersionEntity,
      FileTagEntity,
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uploadDir = configService.get<string>('file.tempDir', '/tmp/file-uploads');
        
        // Ensure the upload directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              // Create tenant-specific directories
              const tenantId = req.tenantId;
              const tenantDir = path.join(uploadDir, tenantId || 'anonymous');
              
              if (!fs.existsSync(tenantDir)) {
                fs.mkdirSync(tenantDir, { recursive: true });
              }
              
              cb(null, tenantDir);
            },
            filename: (req, file, cb) => {
              // Generate a unique filename
              const randomName = crypto.randomBytes(16).toString('hex');
              const extension = path.extname(file.originalname);
              cb(null, `${randomName}${extension}`);
            },
          }),
          limits: {
            fileSize: configService.get<number>('file.maxSize', 104857600), // 100MB default
          },
        };
      },
    }),
    StorageModule,
    SecurityModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

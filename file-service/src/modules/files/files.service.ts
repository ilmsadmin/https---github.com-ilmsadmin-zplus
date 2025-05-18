import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, FindOptionsWhere } from 'typeorm';
import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as mime from 'mime-types';

import { FileEntity, FileStatus } from './entities/file.entity';
import { FileVersionEntity } from './entities/file-version.entity';
import { FileTagEntity } from './entities/file-tag.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileFilterDto } from './dto/file-filter.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { StorageService } from '../storage/storage.service';
import { SecurityService } from '../security/security.service';
import { EncryptionService } from '../security/encryption.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    
    @InjectRepository(FileVersionEntity)
    private readonly fileVersionRepository: Repository<FileVersionEntity>,
    
    @InjectRepository(FileTagEntity)
    private readonly fileTagRepository: Repository<FileTagEntity>,
    
    private readonly storageService: StorageService,
    
    private readonly securityService: SecurityService,
    
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new file
   */
  async createFile(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    createFileDto: CreateFileDto,
  ): Promise<FileResponseDto> {
    try {
      // Make sure tenant bucket exists
      const bucketName = this.storageService.getTenantBucketName(tenantId);
      const bucketExists = await this.storageService.bucketExists(bucketName);
      
      if (!bucketExists) {
        await this.storageService.createBucket(bucketName);
        this.logger.log(`Created new storage bucket for tenant: ${tenantId}`);
      }
      
      // Validate and scan file for security threats
      const securityResult = await this.securityService.validateAndScanFile(
        file,
        undefined, // Use default from config
        undefined, // Use default from config
      );
      
      if (!securityResult.isValid) {
        // Clean up temp file
        try {
          await fsPromises.unlink(file.path);
        } catch (error) {
          this.logger.error(`Failed to clean up temp file after validation: ${error.message}`);
        }
        
        throw new BadRequestException(securityResult.validationErrors.join(', '));
      }
      
      if (securityResult.isVirus) {
        // Clean up temp file
        try {
          await fsPromises.unlink(file.path);
        } catch (error) {
          this.logger.error(`Failed to clean up infected file: ${error.message}`);
        }
        
        throw new ForbiddenException('File contains malware and was rejected');
      }
      
      // Determine if file should be encrypted (from DTO or result of security service)
      const shouldEncrypt = createFileDto.encrypt || !!securityResult.encryptionKey;
      let encryptionKey = securityResult.encryptionKey;
      
      if (shouldEncrypt && !encryptionKey) {
        encryptionKey = await this.encryptionService.generateEncryptionKey();
      }
      
      // Generate storage path for tenant
      const fileName = createFileDto.name || path.basename(file.originalname);
      const extension = path.extname(file.originalname).toLowerCase();
      const storageFilePath = `${userId || 'anonymous'}/${Date.now()}-${path.basename(fileName, extension)}${extension}`;
      
      // Prepare file data to store in DB
      const newFile = this.fileRepository.create({
        name: fileName,
        description: createFileDto.description,
        tenantId,
        originalName: file.originalname,
        extension: extension.substring(1), // Remove leading dot
        mimeType: file.mimetype,
        size: file.size,
        path: `/${storageFilePath}`,
        storageLocation: bucketName,
        bucketName,
        status: FileStatus.ACTIVE,
        encrypted: shouldEncrypt,
        encryptionKey: shouldEncrypt ? this.encryptionService.encryptFileKey(encryptionKey) : null,
        virusScanned: true,
        creatorId: userId || 'anonymous',
        ownerId: userId || 'anonymous',
        isPublic: createFileDto.isPublic || false,
        metadata: createFileDto.metadata || {},
        folderId: createFileDto.folderId,
      });
      
      // Save file entity first to get ID
      const savedFile = await this.fileRepository.save(newFile);
      
      // Read file from temp location
      let fileBuffer = await fsPromises.readFile(file.path);
      
      // Calculate content hash
      const contentHash = await this.encryptionService.generateContentHash(fileBuffer);
      savedFile.contentHash = contentHash;
      
      // Encrypt file if needed
      if (shouldEncrypt) {
        const encryptResult = await this.encryptionService.encrypt(fileBuffer, encryptionKey);
        fileBuffer = encryptResult.encryptedData;
        
        // Store encryption metadata
        savedFile.metadata = {
          ...savedFile.metadata,
          encryptionMetadata: {
            iv: encryptResult.iv,
            authTag: encryptResult.authTag,
          },
        };
      }
      
      // Upload to storage
      await this.storageService.uploadFile(bucketName, storageFilePath, fileBuffer, {
        'Content-Type': file.mimetype,
        'Original-Name': encodeURIComponent(file.originalname),
        'Content-Hash': contentHash,
      });
      
      // Create initial version
      const initialVersion = this.fileVersionRepository.create({
        fileId: savedFile.id,
        versionNumber: 1,
        name: fileName,
        size: file.size,
        mimeType: file.mimetype,
        tenantId,
        creatorId: userId || 'anonymous',
        storageLocation: storageFilePath,
        contentHash,
        encrypted: shouldEncrypt,
        encryptionKey: shouldEncrypt ? this.encryptionService.encryptFileKey(encryptionKey) : null,
        virusScanned: true,
        metadata: savedFile.metadata,
      });
      
      const savedVersion = await this.fileVersionRepository.save(initialVersion);
      
      // Update file with current version ID
      savedFile.currentVersionId = savedVersion.id;
      await this.fileRepository.save(savedFile);
      
      // Add tags if provided
      if (createFileDto.tags && createFileDto.tags.length > 0) {
        await this.addTags(tenantId, savedFile.id, userId, createFileDto.tags);
      }
      
      // Clean up temp file
      try {
        await fsPromises.unlink(file.path);
      } catch (error) {
        this.logger.error(`Failed to clean up temp file: ${error.message}`);
      }
      
      // Return file response
      return this.fileEntityToResponseDto(savedFile);
    } catch (error) {
      this.logger.error(`Error creating file: ${error.message}`, error.stack);
      
      // Clean up temp file
      try {
        await fsPromises.unlink(file.path);
      } catch (cleanupError) {
        this.logger.error(`Failed to clean up temp file after error: ${cleanupError.message}`);
      }
      
      // Rethrow specific exceptions, wrap others
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to create file: ${error.message}`);
    }
  }

  /**
   * Create multiple files at once
   */
  async createMultipleFiles(
    tenantId: string,
    userId: string,
    files: Express.Multer.File[],
    options: { folderId?: string; encrypt?: boolean },
  ): Promise<FileResponseDto[]> {
    // Create files one by one (we could optimize this with a batch operation in the future)
    const results: FileResponseDto[] = [];
    
    for (const file of files) {
      try {
        const fileResponse = await this.createFile(
          tenantId,
          userId,
          file,
          {
            name: path.basename(file.originalname),
            folderId: options.folderId,
            encrypt: options.encrypt,
          },
        );
        
        results.push(fileResponse);
      } catch (error) {
        this.logger.error(`Error creating file "${file.originalname}": ${error.message}`);
        // Continue with other files even if one fails
      }
    }
    
    return results;
  }

  /**
   * Find all files with filtering
   */
  async findAll(
    tenantId: string,
    filterDto: FileFilterDto,
  ): Promise<{ data: FileResponseDto[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        tag,
        ...filters
      } = filterDto;
      
      // Build base query
      const whereClause: FindOptionsWhere<FileEntity> = {
        tenantId,
        ...filters,
      };
      
      // Add wildcard search for name if provided
      if (filters.name) {
        whereClause.name = Like(`%${filters.name}%`);
      }
      
      // Don't show deleted files by default unless specifically requested
      if (!filters.status) {
        whereClause.status = FileStatus.ACTIVE;
      }
      
      // Handle date filters
      if (filterDto.createdAfter) {
        whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(filterDto.createdAfter) };
      }
      
      if (filterDto.createdBefore) {
        whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(filterDto.createdBefore) };
      }
      
      // Handle size filters
      if (filterDto.minSize !== undefined) {
        whereClause.size = { ...whereClause.size, gte: filterDto.minSize };
      }
      
      if (filterDto.maxSize !== undefined) {
        whereClause.size = { ...whereClause.size, lte: filterDto.maxSize };
      }
      
      // If tag filter is provided, find files with that tag
      let fileIdsWithTag: string[] = [];
      if (tag) {
        const fileTags = await this.fileTagRepository.find({
          where: { tenantId, name: tag },
          select: ['fileId'],
        });
        
        fileIdsWithTag = fileTags.map(ft => ft.fileId);
        
        if (fileIdsWithTag.length === 0) {
          // No files found with this tag
          return { data: [], total: 0, page, limit };
        }
        
        whereClause.id = In(fileIdsWithTag);
      }
      
      // Calculate skip for pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [files, total] = await this.fileRepository.findAndCount({
        where: whereClause,
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
        relations: ['tags'],
      });
      
      // Transform to response DTOs
      const fileResponses = await Promise.all(
        files.map(file => this.fileEntityToResponseDto(file)),
      );
      
      return {
        data: fileResponses,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding files: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Find a file by ID
   */
  async findById(tenantId: string, id: string): Promise<FileResponseDto> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id, tenantId },
        relations: ['tags'],
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      return this.fileEntityToResponseDto(file);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error finding file by ID: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(
    tenantId: string,
    id: string,
    updateFileDto: UpdateFileDto,
  ): Promise<FileResponseDto> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id, tenantId },
        relations: ['tags'],
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      // Update file properties
      if (updateFileDto.name !== undefined) {
        file.name = updateFileDto.name;
      }
      
      if (updateFileDto.description !== undefined) {
        file.description = updateFileDto.description;
      }
      
      if (updateFileDto.folderId !== undefined) {
        file.folderId = updateFileDto.folderId;
      }
      
      if (updateFileDto.isPublic !== undefined) {
        file.isPublic = updateFileDto.isPublic;
      }
      
      if (updateFileDto.metadata !== undefined) {
        // Merge existing metadata with new metadata
        file.metadata = { ...file.metadata, ...updateFileDto.metadata };
      }
      
      // Save updated file
      const updatedFile = await this.fileRepository.save(file);
      
      return this.fileEntityToResponseDto(updatedFile);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error updating file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to update file: ${error.message}`);
    }
  }

  /**
   * Update file status (e.g., mark as deleted or restore)
   */
  async updateFileStatus(
    tenantId: string,
    id: string,
    status: FileStatus,
  ): Promise<FileResponseDto> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id, tenantId },
        relations: ['tags'],
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      // Update status
      file.status = status;
      
      // If marking as deleted, set deletedAt timestamp
      if (status === FileStatus.DELETED) {
        file.deletedAt = new Date();
      } else if (file.deletedAt) {
        // If restoring, clear deletedAt
        file.deletedAt = null;
      }
      
      // Save updated file
      const updatedFile = await this.fileRepository.save(file);
      
      return this.fileEntityToResponseDto(updatedFile);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error updating file status: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to update file status: ${error.message}`);
    }
  }

  /**
   * Delete a file (soft delete)
   */
  async deleteFile(tenantId: string, id: string): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id, tenantId },
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      // Mark as deleted (soft delete)
      await this.updateFileStatus(tenantId, id, FileStatus.DELETED);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Download a file
   */
  async downloadFile(
    tenantId: string,
    id: string,
    userId?: string,
    isPreview: boolean = false,
  ): Promise<{ stream: Readable; fileName: string; mimeType: string; size: number }> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id, tenantId },
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${id} not found`);
      }
      
      // Check if file is active
      if (file.status !== FileStatus.ACTIVE) {
        throw new BadRequestException(`File is not available for download (status: ${file.status})`);
      }
      
      // Get current version
      const version = await this.fileVersionRepository.findOne({
        where: { id: file.currentVersionId, tenantId },
      });
      
      if (!version) {
        throw new InternalServerErrorException(`Current version of file not found`);
      }
      
      // Get file stream from storage
      const bucketName = file.bucketName;
      const objectKey = version.storageLocation;
      
      // Increment download or view count
      if (!isPreview) {
        file.downloadCount += 1;
      } else {
        file.viewCount += 1;
      }
      await this.fileRepository.save(file);
      
      // Get stream from storage
      const stream = await this.storageService.getFileStream(bucketName, objectKey);
      
      // If file is encrypted, we need to decrypt it
      // Note: In a real implementation, you would use a streaming decrypt solution
      // rather than loading the whole file into memory
      if (file.encrypted) {
        // Get decryption key
        const encryptedKey = file.encryptionKey;
        const decryptedKey = this.encryptionService.decryptFileKey(encryptedKey);
        
        // Get encryption metadata
        const { iv, authTag } = file.metadata.encryptionMetadata || {};
        
        if (!iv || !authTag) {
          throw new InternalServerErrorException('Missing encryption metadata for encrypted file');
        }
        
        // Read the entire stream to buffer
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const encryptedData = Buffer.concat(chunks);
        
        // Decrypt data
        const decryptedData = await this.encryptionService.decrypt(
          encryptedData,
          decryptedKey,
          iv,
          authTag,
        );
        
        // Create new stream from decrypted data
        const decryptedStream = new Readable();
        decryptedStream.push(decryptedData);
        decryptedStream.push(null); // Signal the end of the stream
        
        return {
          stream: decryptedStream,
          fileName: file.originalName,
          mimeType: file.mimeType,
          size: decryptedData.length,
        };
      }
      
      return {
        stream,
        fileName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Get all versions of a file
   */
  async getFileVersions(tenantId: string, fileId: string): Promise<any[]> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      
      const versions = await this.fileVersionRepository.find({
        where: { fileId, tenantId },
        order: { versionNumber: 'DESC' },
      });
      
      return versions.map(version => ({
        id: version.id,
        versionNumber: version.versionNumber,
        name: version.name,
        size: version.size,
        mimeType: version.mimeType,
        createdAt: version.createdAt,
        creatorId: version.creatorId,
        changeDescription: version.changeDescription,
        isCurrent: version.id === file.currentVersionId,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error getting file versions: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get file versions: ${error.message}`);
    }
  }

  /**
   * Create a new version of a file
   */
  async createNewVersion(
    tenantId: string,
    fileId: string,
    userId: string,
    file: Express.Multer.File,
    changeDescription?: string,
  ): Promise<FileResponseDto> {
    try {
      const existingFile = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
      });
      
      if (!existingFile) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      
      // Validate and scan file for security threats
      const securityResult = await this.securityService.validateAndScanFile(
        file,
        undefined, // Use default from config
        undefined, // Use default from config
      );
      
      if (!securityResult.isValid) {
        // Clean up temp file
        try {
          await fsPromises.unlink(file.path);
        } catch (error) {
          this.logger.error(`Failed to clean up temp file after validation: ${error.message}`);
        }
        
        throw new BadRequestException(securityResult.validationErrors.join(', '));
      }
      
      if (securityResult.isVirus) {
        // Clean up temp file
        try {
          await fsPromises.unlink(file.path);
        } catch (error) {
          this.logger.error(`Failed to clean up infected file: ${error.message}`);
        }
        
        throw new ForbiddenException('File contains malware and was rejected');
      }
      
      // Get the last version number
      const lastVersion = await this.fileVersionRepository.findOne({
        where: { fileId, tenantId },
        order: { versionNumber: 'DESC' },
      });
      
      const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
      
      // Determine if file should be encrypted
      const shouldEncrypt = existingFile.encrypted;
      let encryptionKey = null;
      
      if (shouldEncrypt) {
        encryptionKey = this.encryptionService.decryptFileKey(existingFile.encryptionKey);
      }
      
      // Generate storage path for tenant
      const fileName = existingFile.name;
      const extension = path.extname(file.originalname).toLowerCase();
      const storageFilePath = `${userId || 'anonymous'}/${Date.now()}-${path.basename(fileName, extension)}-v${newVersionNumber}${extension}`;
      
      // Read file from temp location
      let fileBuffer = await fsPromises.readFile(file.path);
      
      // Calculate content hash
      const contentHash = await this.encryptionService.generateContentHash(fileBuffer);
      
      // Prepare metadata for file
      let fileMetadata = { ...existingFile.metadata };
      
      // Encrypt file if needed
      if (shouldEncrypt) {
        const encryptResult = await this.encryptionService.encrypt(fileBuffer, encryptionKey);
        fileBuffer = encryptResult.encryptedData;
        
        // Store encryption metadata
        fileMetadata = {
          ...fileMetadata,
          encryptionMetadata: {
            iv: encryptResult.iv,
            authTag: encryptResult.authTag,
          },
        };
      }
      
      // Create new version entity
      const newVersion = this.fileVersionRepository.create({
        fileId,
        versionNumber: newVersionNumber,
        name: fileName,
        size: file.size,
        mimeType: file.mimetype,
        tenantId,
        creatorId: userId || 'anonymous',
        storageLocation: storageFilePath,
        contentHash,
        encrypted: shouldEncrypt,
        encryptionKey: shouldEncrypt ? existingFile.encryptionKey : null,
        virusScanned: true,
        metadata: fileMetadata,
        changeDescription,
      });
      
      // Upload to storage
      await this.storageService.uploadFile(existingFile.bucketName, storageFilePath, fileBuffer, {
        'Content-Type': file.mimetype,
        'Original-Name': encodeURIComponent(file.originalname),
        'Content-Hash': contentHash,
        'Version': `${newVersionNumber}`,
      });
      
      // Save new version
      const savedVersion = await this.fileVersionRepository.save(newVersion);
      
      // Update file with new data
      existingFile.size = file.size;
      existingFile.mimeType = file.mimetype;
      existingFile.currentVersionId = savedVersion.id;
      existingFile.metadata = fileMetadata;
      existingFile.updatedAt = new Date();
      
      // Save updated file
      const updatedFile = await this.fileRepository.save(existingFile);
      
      // Clean up temp file
      try {
        await fsPromises.unlink(file.path);
      } catch (error) {
        this.logger.error(`Failed to clean up temp file: ${error.message}`);
      }
      
      return this.fileEntityToResponseDto(updatedFile);
    } catch (error) {
      this.logger.error(`Error creating new version: ${error.message}`, error.stack);
      
      // Clean up temp file
      try {
        await fsPromises.unlink(file.path);
      } catch (cleanupError) {
        this.logger.error(`Failed to clean up temp file after error: ${cleanupError.message}`);
      }
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to create new version: ${error.message}`);
    }
  }

  /**
   * Add tags to a file
   */
  async addTags(
    tenantId: string,
    fileId: string,
    userId: string,
    tags: string[],
  ): Promise<FileResponseDto> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
        relations: ['tags'],
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      
      // Normalize and validate tags
      const normalizedTags = tags
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag !== '')
        .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
        .slice(0, 20); // Limit to 20 tags
      
      if (normalizedTags.length === 0) {
        throw new BadRequestException('No valid tags provided');
      }
      
      // Get existing tag names
      const existingTagNames = file.tags?.map(tag => tag.name) || [];
      
      // Filter out tags that already exist
      const newTags = normalizedTags.filter(tag => !existingTagNames.includes(tag));
      
      // Create and save new tag entities
      if (newTags.length > 0) {
        const tagEntities = newTags.map(tagName =>
          this.fileTagRepository.create({
            name: tagName,
            fileId,
            tenantId,
            creatorId: userId || 'anonymous',
          }),
        );
        
        await this.fileTagRepository.save(tagEntities);
      }
      
      // Refresh file with new tags
      const updatedFile = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
        relations: ['tags'],
      });
      
      return this.fileEntityToResponseDto(updatedFile);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      
      this.logger.error(`Error adding tags: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to add tags: ${error.message}`);
    }
  }

  /**
   * Remove a tag from a file
   */
  async removeTag(
    tenantId: string,
    fileId: string,
    tagName: string,
  ): Promise<FileResponseDto> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
        relations: ['tags'],
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      
      // Find the tag to remove
      const normalizedTagName = tagName.trim().toLowerCase();
      const tagToRemove = file.tags?.find(tag => tag.name === normalizedTagName);
      
      if (!tagToRemove) {
        throw new NotFoundException(`Tag "${tagName}" not found on file`);
      }
      
      // Remove the tag
      await this.fileTagRepository.remove(tagToRemove);
      
      // Refresh file with updated tags
      const updatedFile = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
        relations: ['tags'],
      });
      
      return this.fileEntityToResponseDto(updatedFile);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error removing tag: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to remove tag: ${error.message}`);
    }
  }

  /**
   * Get a pre-signed URL for a file
   */
  async getPresignedUrl(
    tenantId: string,
    fileId: string,
    expiresIn: number = 3600,
  ): Promise<{ url: string; expiresAt: Date }> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, tenantId },
      });
      
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }
      
      // Check if file is active
      if (file.status !== FileStatus.ACTIVE) {
        throw new BadRequestException(`File is not available (status: ${file.status})`);
      }
      
      // Get current version
      const version = await this.fileVersionRepository.findOne({
        where: { id: file.currentVersionId, tenantId },
      });
      
      if (!version) {
        throw new InternalServerErrorException(`Current version of file not found`);
      }
      
      // Get pre-signed URL from storage
      const bucketName = file.bucketName;
      const objectKey = version.storageLocation;
      
      // Generate pre-signed URL
      const url = await this.storageService.getPresignedUrl(bucketName, objectKey, expiresIn);
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      return { url, expiresAt };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      
      this.logger.error(`Error generating presigned URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Convert a file entity to a response DTO
   */
  private fileEntityToResponseDto(file: FileEntity): FileResponseDto {
    return {
      id: file.id,
      name: file.name,
      description: file.description,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      status: file.status,
      encrypted: file.encrypted,
      creatorId: file.creatorId,
      ownerId: file.ownerId,
      isPublic: file.isPublic,
      downloadCount: file.downloadCount,
      viewCount: file.viewCount,
      metadata: file.metadata,
      folderId: file.folderId,
      currentVersionId: file.currentVersionId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      tags: file.tags?.map(tag => tag.name) || [],
    };
  }
}

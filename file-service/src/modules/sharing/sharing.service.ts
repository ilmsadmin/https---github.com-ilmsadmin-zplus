import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { FileShareEntity, ShareType, SharePermission } from './entities/file-share.entity';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { ShareFilterDto } from './dto/share-filter.dto';
import { ShareResponseDto } from './dto/share-response.dto';
import { FilesService } from '../files/files.service';
import { EncryptionService } from '../security/encryption.service';

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(FileShareEntity)
    private readonly shareRepository: Repository<FileShareEntity>,
    private readonly filesService: FilesService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new file share
   * @param tenantId Tenant ID
   * @param userId User ID creating the share
   * @param createShareDto Share creation data
   * @returns The created share
   */
  async createShare(
    tenantId: string,
    userId: string,
    createShareDto: CreateShareDto,
  ): Promise<ShareResponseDto> {
    const {
      fileId,
      type,
      sharedWith,
      permission,
      passwordProtected,
      password,
      expiresAt,
      maxDownloads,
      metadata,
    } = createShareDto;

    // Validate file exists and user has access
    const file = await this.filesService.findById(tenantId, fileId);
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    // Validate share data based on type
    if ((type === ShareType.USER || type === ShareType.TEAM) && !sharedWith) {
      throw new BadRequestException('sharedWith is required for USER and TEAM share types');
    }

    // For link shares, generate access key
    let accessKey = null;
    if (type === ShareType.LINK) {
      accessKey = this.generateAccessKey();
    }

    // Handle password protection
    let passwordHash = null;
    if (passwordProtected && password) {
      passwordHash = await bcrypt.hash(password, this.saltRounds);
    }

    // Create share entity
    const newShare = this.shareRepository.create({
      tenantId,
      fileId,
      type,
      sharedWith: sharedWith || null,
      sharedBy: userId,
      permission,
      accessKey,
      passwordProtected: !!passwordProtected,
      passwordHash,
      expiresAt,
      maxDownloads,
      metadata: metadata || {},
    });

    // Save the share
    const savedShare = await this.shareRepository.save(newShare);
    
    // Return formatted response
    return this.mapToResponseDto(savedShare, file.name, file.mimeType);
  }

  /**
   * Get all shares with filtering
   * @param tenantId Tenant ID
   * @param filterDto Filter criteria
   * @returns List of shares
   */
  async findAll(
    tenantId: string,
    filterDto: ShareFilterDto,
  ): Promise<{ data: ShareResponseDto[]; total: number; page: number; limit: number }> {
    const {
      fileId,
      type,
      sharedWith,
      sharedBy,
      permission,
      isActive,
      includeExpired,
      page = 1,
      limit = 20,
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      tenantId,
    };

    if (fileId) {
      where.fileId = fileId;
    }

    if (type) {
      where.type = type;
    }

    if (sharedWith) {
      where.sharedWith = sharedWith;
    }

    if (sharedBy) {
      where.sharedBy = sharedBy;
    }

    if (permission) {
      where.permission = permission;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Handle expiration
    if (!includeExpired) {
      where.expiresAt = IsNull() || Not(LessThan(new Date()));
    }

    // Execute query
    const [shares, total] = await this.shareRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
      relations: ['file'],
    });

    // Map to response DTOs
    const data = await Promise.all(
      shares.map(async (share) => {
        const fileName = share.file?.name;
        const fileMimeType = share.file?.mimeType;
        return this.mapToResponseDto(share, fileName, fileMimeType);
      })
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get share by ID
   * @param tenantId Tenant ID
   * @param id Share ID
   * @returns The share
   */
  async findById(tenantId: string, id: string): Promise<ShareResponseDto> {
    const share = await this.shareRepository.findOne({
      where: { id, tenantId },
      relations: ['file'],
    });

    if (!share) {
      throw new NotFoundException(`Share with ID ${id} not found`);
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException('This share has expired');
    }

    // Check if max downloads reached
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      throw new BadRequestException('This share has reached its maximum download limit');
    }

    const fileName = share.file?.name;
    const fileMimeType = share.file?.mimeType;
    return this.mapToResponseDto(share, fileName, fileMimeType);
  }

  /**
   * Get share by access key (for link shares)
   * @param accessKey Share access key
   * @returns The share
   */
  async findByAccessKey(accessKey: string): Promise<ShareResponseDto> {
    const share = await this.shareRepository.findOne({
      where: { accessKey, type: ShareType.LINK, isActive: true },
      relations: ['file'],
    });

    if (!share) {
      throw new NotFoundException('Invalid or expired share link');
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException('This share link has expired');
    }

    // Check if max downloads reached
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      throw new BadRequestException('This share has reached its maximum download limit');
    }

    // Update last accessed timestamp
    share.lastAccessed = new Date();
    await this.shareRepository.save(share);

    const fileName = share.file?.name;
    const fileMimeType = share.file?.mimeType;
    return this.mapToResponseDto(share, fileName, fileMimeType);
  }

  /**
   * Update a share
   * @param tenantId Tenant ID
   * @param id Share ID
   * @param updateShareDto Share update data
   * @returns The updated share
   */
  async updateShare(
    tenantId: string,
    id: string,
    updateShareDto: UpdateShareDto,
  ): Promise<ShareResponseDto> {
    const {
      permission,
      passwordProtected,
      password,
      expiresAt,
      maxDownloads,
      isActive,
      metadata,
    } = updateShareDto;

    // Get the share
    const share = await this.shareRepository.findOne({
      where: { id, tenantId },
      relations: ['file'],
    });

    if (!share) {
      throw new NotFoundException(`Share with ID ${id} not found`);
    }

    // Update fields
    if (permission !== undefined) share.permission = permission;
    if (passwordProtected !== undefined) share.passwordProtected = passwordProtected;
    
    // Update password if provided and passwordProtected is true
    if (passwordProtected && password) {
      share.passwordHash = await bcrypt.hash(password, this.saltRounds);
    } else if (passwordProtected === false) {
      share.passwordHash = null;
    }
    
    if (expiresAt !== undefined) share.expiresAt = expiresAt;
    if (maxDownloads !== undefined) share.maxDownloads = maxDownloads;
    if (isActive !== undefined) share.isActive = isActive;
    if (metadata) share.metadata = { ...share.metadata, ...metadata };

    const updatedShare = await this.shareRepository.save(share);
    
    const fileName = share.file?.name;
    const fileMimeType = share.file?.mimeType;
    return this.mapToResponseDto(updatedShare, fileName, fileMimeType);
  }

  /**
   * Delete a share
   * @param tenantId Tenant ID
   * @param id Share ID
   * @returns Success status
   */
  async deleteShare(tenantId: string, id: string): Promise<boolean> {
    const share = await this.shareRepository.findOne({
      where: { id, tenantId },
    });

    if (!share) {
      throw new NotFoundException(`Share with ID ${id} not found`);
    }

    await this.shareRepository.remove(share);
    return true;
  }

  /**
   * Validate share access with password
   * @param shareId Share ID
   * @param accessKey Share access key (for link shares)
   * @param password Password
   * @returns The share if access granted
   */
  async validateShareAccess(
    shareId: string,
    accessKey?: string,
    password?: string,
  ): Promise<ShareResponseDto> {
    let share: FileShareEntity;

    // Find share by ID or access key
    if (shareId) {
      share = await this.shareRepository.findOne({
        where: { id: shareId, isActive: true },
        relations: ['file'],
      });
    } else if (accessKey) {
      share = await this.shareRepository.findOne({
        where: { accessKey, type: ShareType.LINK, isActive: true },
        relations: ['file'],
      });
    } else {
      throw new BadRequestException('Either shareId or accessKey must be provided');
    }

    if (!share) {
      throw new NotFoundException('Share not found or inactive');
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new UnauthorizedException('This share has expired');
    }

    // Check if max downloads reached
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      throw new UnauthorizedException('This share has reached its maximum download limit');
    }

    // Check password if required
    if (share.passwordProtected) {
      if (!password) {
        throw new UnauthorizedException('Password required to access this shared file');
      }

      const passwordValid = await bcrypt.compare(password, share.passwordHash);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    const fileName = share.file?.name;
    const fileMimeType = share.file?.mimeType;
    return this.mapToResponseDto(share, fileName, fileMimeType);
  }

  /**
   * Increment download count for a share
   * @param shareId Share ID
   */
  async incrementDownloadCount(shareId: string): Promise<void> {
    await this.shareRepository.increment({ id: shareId }, 'downloadCount', 1);
    await this.shareRepository.update({ id: shareId }, { lastAccessed: new Date() });
  }

  /**
   * Increment view count for a share
   * @param shareId Share ID
   */
  async incrementViewCount(shareId: string): Promise<void> {
    await this.shareRepository.increment({ id: shareId }, 'viewCount', 1);
    await this.shareRepository.update({ id: shareId }, { lastAccessed: new Date() });
  }

  /**
   * Generate unique access key for link shares
   */
  private generateAccessKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Map share entity to response DTO
   */
  private mapToResponseDto(
    share: FileShareEntity,
    fileName?: string,
    fileMimeType?: string,
  ): ShareResponseDto {
    const response = new ShareResponseDto();
    response.id = share.id;
    response.tenantId = share.tenantId;
    response.fileId = share.fileId;
    response.fileName = fileName;
    response.fileMimeType = fileMimeType;
    response.type = share.type;
    response.sharedWith = share.sharedWith;
    response.sharedBy = share.sharedBy;
    response.permission = share.permission;
    response.accessKey = share.accessKey;
    response.passwordProtected = share.passwordProtected;
    response.expiresAt = share.expiresAt;
    response.maxDownloads = share.maxDownloads;
    response.downloadCount = share.downloadCount;
    response.viewCount = share.viewCount;
    response.isActive = share.isActive;
    response.lastAccessed = share.lastAccessed;
    response.metadata = share.metadata;
    response.createdAt = share.createdAt;
    response.updatedAt = share.updatedAt;
    
    // Generate share URL for link shares
    if (share.type === ShareType.LINK && share.accessKey) {
      // Base URL would typically come from configuration
      response.shareUrl = `/api/shares/public/${share.accessKey}`;
    }
    
    return response;
  }
}

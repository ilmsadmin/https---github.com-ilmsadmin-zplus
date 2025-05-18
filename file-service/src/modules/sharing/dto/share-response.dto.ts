import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareType, SharePermission } from '../entities/file-share.entity';

export class ShareResponseDto {
  @ApiProperty({ description: 'Share ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'File ID' })
  fileId: string;

  @ApiPropertyOptional({ description: 'File name' })
  fileName?: string;

  @ApiPropertyOptional({ description: 'File MIME type' })
  fileMimeType?: string;

  @ApiProperty({ description: 'Share type', enum: ShareType })
  type: ShareType;

  @ApiPropertyOptional({ description: 'User or team ID that has access to the share' })
  sharedWith?: string;

  @ApiProperty({ description: 'User ID who created the share' })
  sharedBy: string;

  @ApiProperty({ description: 'Permission level granted', enum: SharePermission })
  permission: SharePermission;

  @ApiPropertyOptional({ description: 'Unique access key for link shares' })
  accessKey?: string;

  @ApiProperty({ description: 'Whether the share is password protected' })
  passwordProtected: boolean;

  @ApiPropertyOptional({ description: 'Expiry date for the share' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Maximum number of downloads allowed' })
  maxDownloads?: number;

  @ApiProperty({ description: 'Current download count' })
  downloadCount: number;

  @ApiProperty({ description: 'Current view count' })
  viewCount: number;

  @ApiProperty({ description: 'Whether the share is currently active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Last time the share was accessed' })
  lastAccessed?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Full share URL for link shares' })
  shareUrl?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { FileStatus } from '../entities/file.entity';

export class FileResponseDto {
  @ApiProperty({ description: 'Unique identifier of the file' })
  id: string;

  @ApiProperty({ description: 'Name of the file' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the file' })
  description?: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'File extension' })
  extension: string;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Path to the file within the tenant context' })
  path: string;

  @ApiProperty({ description: 'Status of the file', enum: FileStatus })
  status: FileStatus;

  @ApiProperty({ description: 'Whether the file is encrypted' })
  encrypted: boolean;

  @ApiProperty({ description: 'ID of the user who created the file' })
  creatorId: string;

  @ApiProperty({ description: 'ID of the user who owns the file' })
  ownerId: string;

  @ApiProperty({ description: 'Whether the file is publicly accessible' })
  isPublic: boolean;

  @ApiProperty({ description: 'Number of times the file has been downloaded' })
  downloadCount: number;

  @ApiProperty({ description: 'Number of times the file has been viewed' })
  viewCount: number;

  @ApiPropertyOptional({ description: 'Custom metadata for the file', type: Object })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID of the folder containing the file' })
  folderId?: string;

  @ApiProperty({ description: 'ID of the current version of the file' })
  currentVersionId: string;

  @ApiProperty({ description: 'Date when the file was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the file was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'File tags', type: [String] })
  tags?: string[];
}

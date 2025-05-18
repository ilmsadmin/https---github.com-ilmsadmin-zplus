import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { FileStatus } from '../entities/file.entity';

export class FileFilterDto {
  @ApiPropertyOptional({ description: 'Filter by folder ID' })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Filter by file name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by file extension' })
  @IsString()
  @IsOptional()
  extension?: string;

  @ApiPropertyOptional({ description: 'Filter by mime type' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Filter by file status', enum: FileStatus })
  @IsEnum(FileStatus)
  @IsOptional()
  status?: FileStatus;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsUUID()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag name' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ description: 'Filter by created after date' })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Filter by created before date' })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @ApiPropertyOptional({ description: 'Minimum file size in bytes' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minSize?: number;

  @ApiPropertyOptional({ description: 'Maximum file size in bytes' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxSize?: number;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page for pagination', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

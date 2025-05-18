import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsUUID } from 'class-validator';
import { ShareType, SharePermission } from '../entities/file-share.entity';

export class ShareFilterDto {
  @ApiPropertyOptional({ description: 'Filter by file ID' })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({ description: 'Filter by share type', enum: ShareType })
  @IsOptional()
  @IsEnum(ShareType)
  type?: ShareType;

  @ApiPropertyOptional({ description: 'Filter by shared with (user or team ID)' })
  @IsOptional()
  @IsString()
  sharedWith?: string;

  @ApiPropertyOptional({ description: 'Filter by shared by (user ID)' })
  @IsOptional()
  @IsString()
  sharedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by permission level', enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permission?: SharePermission;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  
  @ApiPropertyOptional({ description: 'Include expired shares' })
  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}

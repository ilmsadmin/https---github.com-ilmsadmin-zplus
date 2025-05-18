import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsDate, IsInt, Min, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SharePermission } from '../entities/file-share.entity';

export class UpdateShareDto {
  @ApiPropertyOptional({ description: 'Permission level', enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permission?: SharePermission;

  @ApiPropertyOptional({ description: 'Whether the share is password protected' })
  @IsOptional()
  @IsBoolean()
  passwordProtected?: boolean;

  @ApiPropertyOptional({ description: 'Password for accessing the shared file (if passwordProtected is true)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Expiry date for the share' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Maximum number of downloads allowed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDownloads?: number;

  @ApiPropertyOptional({ description: 'Whether the share is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata as key-value pairs to merge with existing' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

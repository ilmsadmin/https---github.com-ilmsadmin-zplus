import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsDate, IsInt, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { SharePermission, ShareType } from '../entities/file-share.entity';

export class CreateShareDto {
  @ApiProperty({ description: 'ID of the file to share' })
  @IsNotEmpty()
  @IsUUID()
  fileId: string;

  @ApiProperty({ description: 'Type of share', enum: ShareType })
  @IsNotEmpty()
  @IsEnum(ShareType)
  type: ShareType;

  @ApiPropertyOptional({ description: 'ID of user or team to share with (required for USER or TEAM types)' })
  @IsOptional()
  @IsString()
  sharedWith?: string;

  @ApiProperty({ description: 'Permission level', enum: SharePermission })
  @IsNotEmpty()
  @IsEnum(SharePermission)
  permission: SharePermission;

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

  @ApiPropertyOptional({ description: 'Additional metadata as key-value pairs' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

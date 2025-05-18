import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export class UpdateFolderDto {
  @ApiPropertyOptional({ description: 'New name for the folder' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'New description for the folder' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'New owner ID for the folder' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as key-value pairs to merge with existing' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

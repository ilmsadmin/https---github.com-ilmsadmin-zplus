import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsUUID, MaxLength } from 'class-validator';

enum ModuleType {
  CORE = 'core',
  EXTENSION = 'extension',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
}

export class CreateModuleDto {
  @ApiProperty({ description: 'Name of the module' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Slug for the module (URL-friendly identifier)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ description: 'Description of the module' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'URL or path to the module icon' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the module' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether the module is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the module is a system module' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({ description: 'Type of the module', enum: ModuleType })
  @IsNotEmpty()
  @IsEnum(ModuleType)
  type: ModuleType;

  @ApiPropertyOptional({ description: 'JSON schema for module configuration' })
  @IsOptional()
  @IsObject()
  configSchema?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID of the publisher' })
  @IsOptional()
  @IsUUID()
  publisherId?: string;
}

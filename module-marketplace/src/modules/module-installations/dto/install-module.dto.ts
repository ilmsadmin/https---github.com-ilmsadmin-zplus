import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, IsObject } from 'class-validator';

export class InstallModuleDto {
  @ApiProperty({ description: 'ID of the tenant' })
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'ID of the module to install' })
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'ID of the module version to install' })
  @IsNotEmpty()
  @IsUUID()
  moduleVersionId: string;

  @ApiPropertyOptional({ description: 'Module configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom settings for the module' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;

  @ApiProperty({ description: 'ID of the user performing the installation' })
  @IsNotEmpty()
  @IsUUID()
  installedBy: string;
}

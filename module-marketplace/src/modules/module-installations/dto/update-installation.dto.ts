import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsObject } from 'class-validator';

export class UpdateModuleInstallationDto {
  @ApiPropertyOptional({ description: 'Module configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom settings for the module' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

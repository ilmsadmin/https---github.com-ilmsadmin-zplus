import { IsUUID, IsString, IsBoolean, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'The ID of the module this feature flag belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  moduleId: string;

  @ApiProperty({
    description: 'The name of the feature flag',
    example: 'advanced-reporting',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The description of the feature flag',
    example: 'Enables advanced reporting capabilities',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is enabled by default',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is configurable by tenants',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isConfigurable?: boolean;

  @ApiPropertyOptional({
    description: 'Configuration options for the feature flag',
    example: { refreshInterval: 3600, maxItems: 100 },
  })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

import { IsUUID, IsBoolean, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantFeatureFlagDto {
  @ApiProperty({
    description: 'The ID of the feature flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  featureFlagId: string;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is enabled for this tenant',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Tenant-specific configuration for the feature flag',
    example: { customSetting: 'value' },
  })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

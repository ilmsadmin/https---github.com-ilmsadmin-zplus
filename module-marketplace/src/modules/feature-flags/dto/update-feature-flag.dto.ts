import { IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFeatureFlagDto } from './create-feature-flag.dto';

export class UpdateFeatureFlagDto extends PartialType(CreateFeatureFlagDto) {
  @ApiPropertyOptional({
    description: 'The description of the feature flag',
    example: 'Updated description for advanced reporting capabilities',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the feature flag is configurable by tenants',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isConfigurable?: boolean;

  @ApiPropertyOptional({
    description: 'Configuration options for the feature flag',
    example: { refreshInterval: 7200, maxItems: 200 },
  })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

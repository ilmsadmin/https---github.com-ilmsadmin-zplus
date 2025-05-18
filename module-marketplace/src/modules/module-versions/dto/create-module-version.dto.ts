import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsUUID, MaxLength, Matches } from 'class-validator';

enum VersionStatus {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
}

export class CreateModuleVersionDto {
  @ApiProperty({ description: 'ID of the module' })
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'Version number (semver)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/, { message: 'Version must be a valid semver string' })
  @MaxLength(20)
  version: string;

  @ApiPropertyOptional({ description: 'Release notes' })
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiProperty({ description: 'URL to the package' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  packageUrl: string;

  @ApiPropertyOptional({ description: 'Checksum of the package for integrity verification' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  checksum?: string;

  @ApiPropertyOptional({ description: 'Whether the version is deprecated' })
  @IsOptional()
  @IsBoolean()
  isDeprecated?: boolean;

  @ApiPropertyOptional({ description: 'Whether the version is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Status of the version', enum: VersionStatus, default: VersionStatus.DEVELOPMENT })
  @IsOptional()
  @IsEnum(VersionStatus)
  status?: VersionStatus;

  @ApiPropertyOptional({ description: 'Compatibility requirements' })
  @IsOptional()
  @IsObject()
  compatibility?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Information about different artifacts (backend, frontend, etc.)' })
  @IsOptional()
  @IsObject()
  artifacts?: Record<string, any>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, IsBoolean } from 'class-validator';

export class UpdateFileDto {
  @ApiPropertyOptional({ description: 'New name for the file' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'New description for the file' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'ID of the folder to move the file to' })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Whether the file should be publicly accessible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Custom metadata for the file', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

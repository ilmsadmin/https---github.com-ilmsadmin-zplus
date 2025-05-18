import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsBoolean } from 'class-validator';

export class CreateFileDto {
  @ApiProperty({ description: 'Name of the file' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the file' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'ID of the folder where the file should be placed' })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Whether the file should be encrypted' })
  @IsBoolean()
  @IsOptional()
  encrypt?: boolean;

  @ApiPropertyOptional({ description: 'Tags to associate with the file', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the file should be publicly accessible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Custom metadata for the file', type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Permission description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Resource this permission applies to' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ description: 'Action this permission allows' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'Conditions for the permission, in JSON format', required: false })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty({ description: 'Whether this is a system permission', required: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}

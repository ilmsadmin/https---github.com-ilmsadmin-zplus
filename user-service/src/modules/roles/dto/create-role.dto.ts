import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether this is a system role', required: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiProperty({ description: 'Whether this is a default role for new users', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Role scope (global, team, etc)', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ description: 'Permission IDs to assign', required: false, type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

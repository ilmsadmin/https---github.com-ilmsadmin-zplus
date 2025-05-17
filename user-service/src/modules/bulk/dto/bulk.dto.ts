import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class BulkImportUsersDto {
  @ApiProperty({ description: 'Array of users to import', type: [CreateUserDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];

  @ApiProperty({ description: 'Options for bulk import', required: false })
  @IsOptional()
  options?: {
    skipExisting?: boolean;
    updateExisting?: boolean;
    sendWelcomeEmail?: boolean;
  };
}

export class BulkExportUsersDto {
  @ApiProperty({ description: 'User IDs to export', type: [String], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  userIds?: string[];

  @ApiProperty({ description: 'Format of the export (json, csv)', required: false })
  @IsString()
  @IsOptional()
  format?: string = 'json';
}

export class BulkDeleteUsersDto {
  @ApiProperty({ description: 'User IDs to delete', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ description: 'Whether to permanently delete (or just soft delete)', required: false })
  @IsOptional()
  permanent?: boolean = false;
}

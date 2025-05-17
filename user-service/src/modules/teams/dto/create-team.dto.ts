import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsArray } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ description: 'Team name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Team description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Parent team ID', required: false })
  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @ApiProperty({ description: 'Member user IDs', required: false, type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  memberIds?: string[];

  @ApiProperty({ description: 'Team settings', required: false, type: 'object' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

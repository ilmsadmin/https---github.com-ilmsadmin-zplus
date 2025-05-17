import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserSettingDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Setting key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Setting value', type: 'object' })
  @IsObject()
  @Type(() => Object)
  value: any;

  @ApiProperty({ description: 'Setting category', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}

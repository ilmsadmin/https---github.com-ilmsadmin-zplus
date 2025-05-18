import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class MoveFolderDto {
  @ApiProperty({ description: 'ID of the new parent folder' })
  @IsOptional()
  @IsUUID()
  newParentId: string | null;
}

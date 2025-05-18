import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { CreateUsageDto } from './create-usage.dto';

export class UpdateUsageDto extends PartialType(CreateUsageDto) {
  @ApiProperty({ description: 'Associated invoice ID', example: '550e8400-e29b-41d4-a716-446655440003', required: false })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ description: 'Whether this usage has been billed', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  billed?: boolean;
}

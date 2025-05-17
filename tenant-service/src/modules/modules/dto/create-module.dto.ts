import { 
  IsString, 
  IsBoolean, 
  IsObject, 
  IsOptional, 
  MaxLength 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    description: 'The module name',
    example: 'CRM',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The module description',
    example: 'Customer Relationship Management module',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The module version',
    example: '1.0.0',
    default: '1.0.0',
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: 'Whether the module is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'The configuration schema for the module',
    example: { theme: { type: 'object' }, notifications: { type: 'object' } },
  })
  @IsObject()
  @IsOptional()
  configSchema?: Record<string, any>;
}

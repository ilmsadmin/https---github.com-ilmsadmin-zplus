import { IsUUID, IsBoolean, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantModuleDto {
  @ApiProperty({
    description: 'The tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'The module ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  moduleId: string;

  @ApiProperty({
    description: 'Whether the module is enabled for the tenant',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({
    description: 'Configuration for the module',
    example: { theme: { primaryColor: '#1976d2' } },
    default: {},
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({
    description: 'Custom settings for the module',
    example: { showWelcomeMessage: true },
    default: {},
  })
  @IsObject()
  @IsOptional()
  customSettings?: Record<string, any>;
}

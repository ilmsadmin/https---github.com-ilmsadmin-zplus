import { IsUUID, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDependencyDto {
  @ApiProperty({
    description: 'The ID of the dependent module version',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  dependentVersionId: string;

  @ApiProperty({
    description: 'The ID of the module that is required as a dependency',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  dependencyModuleId: string;

  @ApiProperty({
    description: 'The semver range specifying compatible versions of the dependency',
    example: '^1.0.0',
  })
  @IsString()
  versionRequirement: string;

  @ApiProperty({
    description: 'Whether this dependency is optional',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

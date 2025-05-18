import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleDependencyDto } from './create-module-dependency.dto';

export class UpdateModuleDependencyDto extends PartialType(CreateModuleDependencyDto) {
  @ApiPropertyOptional({
    description: 'The semver range specifying compatible versions of the dependency',
    example: '^1.1.0',
  })
  @IsString()
  @IsOptional()
  versionRequirement?: string;

  @ApiPropertyOptional({
    description: 'Whether this dependency is optional',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

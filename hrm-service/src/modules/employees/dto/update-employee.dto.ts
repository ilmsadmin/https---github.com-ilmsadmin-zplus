import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsString, IsEmail, IsUUID, IsOptional, IsNumber, IsObject, Length, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({
    description: 'Employee first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Employee last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Employee email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee status',
    example: 'on-leave',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  status?: string;
}

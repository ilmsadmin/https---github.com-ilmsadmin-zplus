import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email', 'password'] as const)) {
  @ApiProperty({ description: 'New password', required: false })
  @IsString()
  @MinLength(8)
  @IsOptional()
  newPassword?: string;

  @ApiProperty({ description: 'Whether to send email notification about this update', required: false })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}

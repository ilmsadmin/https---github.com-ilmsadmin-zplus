import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserSettingDto } from './create-user-setting.dto';

export class UpdateUserSettingDto extends PartialType(OmitType(CreateUserSettingDto, ['userId', 'key'] as const)) {}

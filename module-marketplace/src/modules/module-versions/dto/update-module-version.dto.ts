import { PartialType } from '@nestjs/swagger';
import { CreateModuleVersionDto } from './create-module-version.dto';

export class UpdateModuleVersionDto extends PartialType(CreateModuleVersionDto) {}

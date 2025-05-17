import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTenantModuleDto } from './create-tenant-module.dto';

export class UpdateTenantModuleDto extends PartialType(
  OmitType(CreateTenantModuleDto, ['tenantId', 'moduleId'] as const),
) {}

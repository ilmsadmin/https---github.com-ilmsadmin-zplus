import { SetMetadata } from '@nestjs/common';

export const SkipQuota = () => SetMetadata('skipQuota', true);

import { 
  IsString, 
  IsUUID, 
  IsBoolean, 
  IsEnum, 
  IsOptional, 
  IsDateString,
  Matches 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum DomainStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

enum VerificationMethod {
  TXT = 'txt',
  CNAME = 'cname'
}

export class CreateDomainDto {
  @ApiProperty({
    description: 'The tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'The domain name',
    example: 'example.com',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$|^[a-z0-9-]+\.example\.com$/, {
    message: 'Domain name must be a valid domain',
  })
  domainName: string;

  @ApiProperty({
    description: 'Whether this is the default domain',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    description: 'The domain status',
    enum: DomainStatus,
    default: DomainStatus.PENDING,
    example: DomainStatus.PENDING,
  })
  @IsEnum(DomainStatus)
  @IsOptional()
  status?: DomainStatus;

  @ApiProperty({
    description: 'Whether SSL is enabled',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sslEnabled?: boolean;

  @ApiProperty({
    description: 'The SSL expiration date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  sslExpiresAt?: string;

  @ApiProperty({
    description: 'The verification method',
    enum: VerificationMethod,
    default: VerificationMethod.TXT,
    example: VerificationMethod.TXT,
  })
  @IsEnum(VerificationMethod)
  @IsOptional()
  verificationMethod?: VerificationMethod;
}

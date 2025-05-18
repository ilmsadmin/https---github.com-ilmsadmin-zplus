import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationChannel } from '../../notifications/enums/notification-channel.enum';

export class CreateTemplateDto {
  @ApiPropertyOptional({ type: String, description: 'Tenant ID (extracted from context if not provided)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ type: String, description: 'Template code (unique within a tenant)' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ type: String, description: 'Template name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String, description: 'Template description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    enum: NotificationChannel, 
    isArray: true, 
    description: 'Supported notification channels',
    default: [NotificationChannel.EMAIL]
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  supportedChannels: NotificationChannel[];

  @ApiPropertyOptional({ type: String, description: 'Email subject template' })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ type: String, description: 'Email HTML content template' })
  @IsOptional()
  @IsString()
  emailHtmlContent?: string;

  @ApiPropertyOptional({ type: String, description: 'Email text content template' })
  @IsOptional()
  @IsString()
  emailTextContent?: string;

  @ApiPropertyOptional({ type: String, description: 'Push notification title template' })
  @IsOptional()
  @IsString()
  pushTitle?: string;

  @ApiPropertyOptional({ type: String, description: 'Push notification body template' })
  @IsOptional()
  @IsString()
  pushBody?: string;

  @ApiPropertyOptional({ type: String, description: 'SMS content template' })
  @IsOptional()
  @IsString()
  smsContent?: string;

  @ApiPropertyOptional({ type: String, description: 'In-app notification title template' })
  @IsOptional()
  @IsString()
  inAppTitle?: string;

  @ApiPropertyOptional({ type: String, description: 'In-app notification content template' })
  @IsOptional()
  @IsString()
  inAppContent?: string;

  @ApiPropertyOptional({ type: Object, description: 'Default variables for template rendering' })
  @IsOptional()
  @IsObject()
  defaultVariables?: Record<string, any>;

  @ApiPropertyOptional({ type: Boolean, description: 'Whether the template is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Object, description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

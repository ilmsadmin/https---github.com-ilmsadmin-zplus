import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, IsDateString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class CreateNotificationDto {
  @ApiPropertyOptional({ type: String, description: 'Tenant ID (extracted from context if not provided)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ type: String, description: 'User ID to send notification to' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ type: String, description: 'User email for direct delivery' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ type: String, description: 'User phone for direct delivery' })
  @IsOptional()
  @IsString()
  userPhone?: string;

  @ApiPropertyOptional({ type: String, description: 'User device token for push notifications' })
  @IsOptional()
  @IsString()
  userDeviceToken?: string;

  @ApiPropertyOptional({ type: String, description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ type: String, description: 'Template code to use (alternative to templateId)' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiProperty({ type: String, description: 'Notification subject' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ type: String, description: 'Notification content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ 
    enum: NotificationChannel, 
    isArray: true, 
    description: 'Channels to deliver the notification through',
    default: [NotificationChannel.EMAIL]
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional({ 
    enum: NotificationPriority, 
    description: 'Notification priority',
    default: NotificationPriority.NORMAL
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ type: Object, description: 'Variables for template rendering' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Schedule delivery for a specific time' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

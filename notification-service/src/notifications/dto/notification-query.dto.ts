import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class NotificationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Tenant ID' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ type: String, description: 'User ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Notification status' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Notification channel' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Notification priority' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ type: String, description: 'Template ID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Created after' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Created before' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Delivered after' })
  @IsOptional()
  @IsDateString()
  deliveredAfter?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Delivered before' })
  @IsOptional()
  @IsDateString()
  deliveredBefore?: string;

  @ApiPropertyOptional({ type: Number, description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

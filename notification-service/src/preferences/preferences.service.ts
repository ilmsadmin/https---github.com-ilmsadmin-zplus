import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationChannel } from '../notifications/enums/notification-channel.enum';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async getPreferences(userId: string, tenantId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { userId, tenantId },
    });
  }

  async getPreferencesByCategory(userId: string, tenantId: string, categoryCode: string): Promise<NotificationPreference> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId, tenantId, categoryCode },
    });
    
    if (!preference) {
      // Return default preferences if not found
      return this.createDefaultPreference(userId, tenantId, categoryCode);
    }
    
    return preference;
  }

  async createOrUpdatePreference(
    userId: string,
    tenantId: string,
    categoryCode: string,
    data: {
      enabledChannels?: NotificationChannel[];
      isEnabled?: boolean;
      email?: string;
      phone?: string;
      deviceTokens?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, tenantId, categoryCode },
    });
    
    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        tenantId,
        categoryCode,
        enabledChannels: data.enabledChannels || [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        email: data.email,
        phone: data.phone,
        deviceTokens: data.deviceTokens || [],
        metadata: data.metadata || {},
      });
    } else {
      // Update existing preference
      if (data.enabledChannels !== undefined) {
        preference.enabledChannels = data.enabledChannels;
      }
      
      if (data.isEnabled !== undefined) {
        preference.isEnabled = data.isEnabled;
      }
      
      if (data.email !== undefined) {
        preference.email = data.email;
      }
      
      if (data.phone !== undefined) {
        preference.phone = data.phone;
      }
      
      if (data.deviceTokens !== undefined) {
        preference.deviceTokens = data.deviceTokens;
      }
      
      if (data.metadata !== undefined) {
        preference.metadata = {
          ...preference.metadata,
          ...data.metadata,
        };
      }
    }
    
    const savedPreference = await this.preferenceRepository.save(preference);
    this.logger.log(`Updated preferences for user ${userId}, category ${categoryCode}`);
    
    return savedPreference;
  }

  async addDeviceToken(userId: string, tenantId: string, deviceToken: string): Promise<void> {
    // Default category for device tokens
    const categoryCode = 'default';
    
    let preference = await this.preferenceRepository.findOne({
      where: { userId, tenantId, categoryCode },
    });
    
    if (!preference) {
      preference = await this.createDefaultPreference(userId, tenantId, categoryCode);
    }
    
    // Add device token if it doesn't already exist
    if (!preference.deviceTokens.includes(deviceToken)) {
      preference.deviceTokens.push(deviceToken);
      await this.preferenceRepository.save(preference);
      this.logger.log(`Added device token for user ${userId}`);
    }
  }

  async removeDeviceToken(userId: string, tenantId: string, deviceToken: string): Promise<void> {
    // Default category for device tokens
    const categoryCode = 'default';
    
    const preference = await this.preferenceRepository.findOne({
      where: { userId, tenantId, categoryCode },
    });
    
    if (preference) {
      preference.deviceTokens = preference.deviceTokens.filter(token => token !== deviceToken);
      await this.preferenceRepository.save(preference);
      this.logger.log(`Removed device token for user ${userId}`);
    }
  }

  async disableChannel(userId: string, tenantId: string, categoryCode: string, channel: NotificationChannel): Promise<NotificationPreference> {
    const preference = await this.getPreferencesByCategory(userId, tenantId, categoryCode);
    
    if (!preference) {
      throw new NotFoundException(`Preferences not found for user ${userId} and category ${categoryCode}`);
    }
    
    preference.enabledChannels = preference.enabledChannels.filter(ch => ch !== channel);
    
    const savedPreference = await this.preferenceRepository.save(preference);
    this.logger.log(`Disabled ${channel} channel for user ${userId}, category ${categoryCode}`);
    
    return savedPreference;
  }

  async enableChannel(userId: string, tenantId: string, categoryCode: string, channel: NotificationChannel): Promise<NotificationPreference> {
    const preference = await this.getPreferencesByCategory(userId, tenantId, categoryCode);
    
    if (!preference) {
      throw new NotFoundException(`Preferences not found for user ${userId} and category ${categoryCode}`);
    }
    
    if (!preference.enabledChannels.includes(channel)) {
      preference.enabledChannels.push(channel);
    }
    
    const savedPreference = await this.preferenceRepository.save(preference);
    this.logger.log(`Enabled ${channel} channel for user ${userId}, category ${categoryCode}`);
    
    return savedPreference;
  }

  private async createDefaultPreference(userId: string, tenantId: string, categoryCode: string): Promise<NotificationPreference> {
    const defaultPreference = this.preferenceRepository.create({
      userId,
      tenantId,
      categoryCode,
      enabledChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      isEnabled: true,
      deviceTokens: [],
      metadata: {},
    });
    
    return this.preferenceRepository.save(defaultPreference);
  }
}

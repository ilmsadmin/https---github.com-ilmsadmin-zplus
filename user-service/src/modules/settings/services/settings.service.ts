import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserSetting } from '../entities/user-setting.entity';
import { CreateUserSettingDto } from '../dto/create-user-setting.dto';
import { UpdateUserSettingDto } from '../dto/update-user-setting.dto';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserSettingDto: CreateUserSettingDto, tenantContext: ITenantContext): Promise<UserSetting> {
    try {
      // Check if setting with same key already exists for the user
      const existingSetting = await this.userSettingRepository.findOne({
        where: {
          userId: createUserSettingDto.userId,
          key: createUserSettingDto.key,
        },
      });

      if (existingSetting) {
        throw new ConflictException(`Setting with key "${createUserSettingDto.key}" already exists for this user`);
      }

      // Create new setting
      const newSetting = this.userSettingRepository.create(createUserSettingDto);
      const savedSetting = await this.userSettingRepository.save(newSetting);

      // Emit event for setting creation
      this.eventEmitter.emit('user-setting.created', {
        tenantId: tenantContext.tenantId,
        setting: savedSetting,
        userId: tenantContext.userId,
      });

      return savedSetting;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create user setting: ${error.message}`);
    }
  }

  async findAll(tenantContext: ITenantContext, filter?: { userId?: string; category?: string }): Promise<UserSetting[]> {
    try {
      const where: FindOptionsWhere<UserSetting> = {};
      
      if (filter?.userId) {
        where.userId = filter.userId;
      }
      
      if (filter?.category) {
        where.category = filter.category;
      }
      
      return await this.userSettingRepository.find({
        where,
        order: {
          key: 'ASC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get user settings: ${error.message}`);
    }
  }

  async findOne(id: string, tenantContext: ITenantContext): Promise<UserSetting> {
    try {
      const setting = await this.userSettingRepository.findOne({
        where: { id },
      });

      if (!setting) {
        throw new NotFoundException(`Setting with ID "${id}" not found`);
      }

      return setting;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get user setting: ${error.message}`);
    }
  }

  async findByKey(userId: string, key: string, tenantContext: ITenantContext): Promise<UserSetting> {
    try {
      const setting = await this.userSettingRepository.findOne({
        where: { userId, key },
      });

      if (!setting) {
        throw new NotFoundException(`Setting with key "${key}" not found for user "${userId}"`);
      }

      return setting;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get user setting: ${error.message}`);
    }
  }

  async update(id: string, updateUserSettingDto: UpdateUserSettingDto, tenantContext: ITenantContext): Promise<UserSetting> {
    try {
      // Check if setting exists
      const setting = await this.findOne(id, tenantContext);

      // Update setting
      const updatedSetting = await this.userSettingRepository.save({
        ...setting,
        ...updateUserSettingDto,
      });

      // Emit event for setting update
      this.eventEmitter.emit('user-setting.updated', {
        tenantId: tenantContext.tenantId,
        setting: updatedSetting,
        userId: tenantContext.userId,
      });

      return updatedSetting;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update user setting: ${error.message}`);
    }
  }

  async remove(id: string, tenantContext: ITenantContext): Promise<void> {
    try {
      // Check if setting exists
      const setting = await this.findOne(id, tenantContext);

      await this.userSettingRepository.remove(setting);

      // Emit event for setting deletion
      this.eventEmitter.emit('user-setting.deleted', {
        tenantId: tenantContext.tenantId,
        settingId: id,
        userId: tenantContext.userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete user setting: ${error.message}`);
    }
  }

  async getSettingsByUser(userId: string, tenantContext: ITenantContext, category?: string): Promise<UserSetting[]> {
    try {
      const where: FindOptionsWhere<UserSetting> = { userId };
      
      if (category) {
        where.category = category;
      }
      
      return await this.userSettingRepository.find({
        where,
        order: {
          key: 'ASC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get user settings: ${error.message}`);
    }
  }

  async bulkCreateOrUpdate(settings: CreateUserSettingDto[], tenantContext: ITenantContext): Promise<UserSetting[]> {
    try {
      const results: UserSetting[] = [];
      
      for (const settingDto of settings) {
        // Check if setting already exists
        const existingSetting = await this.userSettingRepository.findOne({
          where: {
            userId: settingDto.userId,
            key: settingDto.key,
          },
        });
        
        if (existingSetting) {
          // Update existing setting
          const updated = await this.userSettingRepository.save({
            ...existingSetting,
            value: settingDto.value,
            category: settingDto.category,
          });
          
          results.push(updated);
          
          // Emit event for setting update
          this.eventEmitter.emit('user-setting.updated', {
            tenantId: tenantContext.tenantId,
            setting: updated,
            userId: tenantContext.userId,
          });
        } else {
          // Create new setting
          const newSetting = this.userSettingRepository.create(settingDto);
          const saved = await this.userSettingRepository.save(newSetting);
          
          results.push(saved);
          
          // Emit event for setting creation
          this.eventEmitter.emit('user-setting.created', {
            tenantId: tenantContext.tenantId,
            setting: saved,
            userId: tenantContext.userId,
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to bulk create/update user settings: ${error.message}`);
    }
  }

  async deleteSettingsByUser(userId: string, tenantContext: ITenantContext): Promise<void> {
    try {
      const settings = await this.userSettingRepository.find({ where: { userId } });
      
      if (settings.length > 0) {
        await this.userSettingRepository.remove(settings);
        
        // Emit event for bulk deletion
        this.eventEmitter.emit('user-setting.bulk-deleted', {
          tenantId: tenantContext.tenantId,
          userId,
          deletedBy: tenantContext.userId,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete user settings: ${error.message}`);
    }
  }
}

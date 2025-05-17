import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UsersService } from '../../users/services/users.service';
import { BulkImportUsersDto, BulkExportUsersDto, BulkDeleteUsersDto } from '../dto/bulk.dto';
import { User } from '../../users/entities/user.entity';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class BulkService {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async importUsers(bulkImportUsersDto: BulkImportUsersDto, tenantContext: ITenantContext): Promise<{
    success: number;
    failed: number;
    errors: { index: number; email: string; error: string }[];
  }> {
    try {
      const result = {
        success: 0,
        failed: 0,
        errors: [],
      };

      const { users, options } = bulkImportUsersDto;
      const skipExisting = options?.skipExisting ?? true;
      const updateExisting = options?.updateExisting ?? false;

      // Process users in chunks to avoid overloading the database
      const chunkSize = 50;
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        
        await Promise.all(
          chunk.map(async (userData, index) => {
            try {
              const actualIndex = i + index;
              
              // Check if user exists
              let existingUser: User | null = null;
              try {
                existingUser = await this.usersService.findByEmail(userData.email, tenantContext);
              } catch (error) {
                // User not found, which is fine for creating new users
                existingUser = null;
              }

              if (existingUser) {
                if (skipExisting && !updateExisting) {
                  // Skip this user
                  return;
                }

                if (updateExisting) {
                  // Update existing user
                  const { email, ...updateData } = userData;
                  await this.usersService.update(existingUser.id, updateData, tenantContext);
                  result.success++;
                }
              } else {
                // Create new user
                await this.usersService.create(userData, tenantContext);
                result.success++;
              }
            } catch (error) {
              result.failed++;
              result.errors.push({
                index: i + index,
                email: userData.email,
                error: error.message,
              });
            }
          })
        );
      }      // Emit event for bulk import
      this.eventEmitter.emit('users.bulk-imported', {
        tenantId: tenantContext.tenantId,
        result,
        userId: 'system', // Since we don't have userId in tenantContext
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to import users: ${error.message}`);
    }
  }

  async exportUsers(bulkExportUsersDto: BulkExportUsersDto, tenantContext: ITenantContext): Promise<{
    data: any;
    format: string;
    count: number;
  }> {
    try {
      const { userIds, format = 'json' } = bulkExportUsersDto;
      
      let users: User[];
        if (userIds && userIds.length > 0) {
        // Get specific users
        users = await this.usersService.findByIds(userIds, tenantContext);
      } else {
        // Get all users - pass null as the filter
        users = await this.usersService.findAll(null, tenantContext);
      }

      // Remove sensitive information
      const sanitizedUsers = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });

      // Format the data
      let formattedData: any;
      
      if (format.toLowerCase() === 'csv') {
        formattedData = this.convertToCSV(sanitizedUsers);
      } else {
        // Default to JSON
        formattedData = sanitizedUsers;
      }      // Emit event for bulk export
      this.eventEmitter.emit('users.bulk-exported', {
        tenantId: tenantContext.tenantId,
        count: users.length,
        userId: 'system', // Using 'system' as userId
      });

      return {
        data: formattedData,
        format: format.toLowerCase(),
        count: users.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to export users: ${error.message}`);
    }
  }
  async deleteUsers(bulkDeleteUsersDto: BulkDeleteUsersDto, tenantContext: ITenantContext): Promise<{
    success: number;
    failed: number;
    errors: { userId: string; error: string }[];
  }> {
    try {
      const { userIds, permanent = false } = bulkDeleteUsersDto;

      if (!userIds || userIds.length === 0) {
        throw new BadRequestException('No user IDs provided for deletion');
      }

      const result = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process users in chunks
      const chunkSize = 50;
      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize);
        
        await Promise.all(
          chunk.map(async (userId) => {
            try {
              if (permanent) {
                await this.usersService.hardRemove(userId, tenantContext);
              } else {
                await this.usersService.remove(userId, tenantContext);
              }
              result.success++;
            } catch (error) {
              result.failed++;
              result.errors.push({
                userId,
                error: error.message,
              });
            }
          })
        );
      }      // Emit event for bulk deletion
      this.eventEmitter.emit('users.bulk-deleted', {
        tenantId: tenantContext.tenantId,
        result,
        userId: 'system', // Using 'system' as userId
        permanent,
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete users: ${error.message}`);
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' && typeof data[0][key] !== 'function'
    );
    
    // Create CSV header row
    const headerRow = headers.join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return headers.map(header => {
        const value = item[header];
        
        // Handle different types of values
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          // For dates or complex objects
          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }
          return '""';
        } else {
          return String(value);
        }
      }).join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...rows].join('\n');
  }
}

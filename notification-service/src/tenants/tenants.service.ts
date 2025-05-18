import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    return tenant;
  }

  async findByCode(code: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { code },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with code ${code} not found`);
    }
    
    return tenant;
  }

  async getNotificationSettings(tenantId: string): Promise<any> {
    const tenant = await this.findById(tenantId);
    
    // Get notification-related settings from tenant
    return tenant.settings || {};
  }
}

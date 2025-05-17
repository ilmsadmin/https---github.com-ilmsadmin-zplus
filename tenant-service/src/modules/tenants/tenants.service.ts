import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Domain } from '../domains/entities/domain.entity';
import { TenantModule } from '../tenant-modules/entities/tenant-module.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    @InjectRepository(TenantModule)
    private readonly tenantModuleRepository: Repository<TenantModule>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if schema name already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { schemaName: createTenantDto.schemaName }
    });
    
    if (existingTenant) {
      throw new ConflictException(`Tenant with schema name ${createTenantDto.schemaName} already exists`);
    }

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 1. Create the tenant
      const tenant = this.tenantRepository.create(createTenantDto);
      const savedTenant = await queryRunner.manager.save(tenant);
      
      // 2. Create the default domain (schema_name.example.com)
      const defaultDomain = this.domainRepository.create({
        tenantId: savedTenant.id,
        domainName: `${savedTenant.schemaName}.example.com`,
        isDefault: true,
        status: 'active',
        sslEnabled: true,
      });
      await queryRunner.manager.save(defaultDomain);
      
      // 3. Create the tenant schema in the database
      await queryRunner.query(`SELECT create_tenant_schema('${savedTenant.schemaName}')`);
      
      // 4. Assign modules if specified
      if (createTenantDto.modules && createTenantDto.modules.length > 0) {
        const tenantModules = createTenantDto.modules.map(moduleId => 
          this.tenantModuleRepository.create({
            tenantId: savedTenant.id,
            moduleId,
            isEnabled: true,
            config: {},
            customSettings: {},
          })
        );
        await queryRunner.manager.save(tenantModules);
      }
      
      // Commit the transaction
      await queryRunner.commitTransaction();
      
      // Emit tenant created event
      this.eventEmitter.emit('tenant.created', {
        tenantId: savedTenant.id,
        schemaName: savedTenant.schemaName,
        packageId: savedTenant.packageId,
        timestamp: new Date(),
      });
      
      return savedTenant;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['package', 'domains'],
    });
  }

  async findByPackageId(packageId: string): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { packageId },
      relations: ['package', 'domains'],
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['package', 'domains', 'tenantModules', 'tenantModules.module'],
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    return tenant;
  }

  async findBySchemaName(schemaName: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { schemaName },
      relations: ['package', 'domains'],
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with schema name ${schemaName} not found`);
    }
    
    return tenant;
  }

  async findByDomain(domainName: string): Promise<Tenant> {
    const domain = await this.domainRepository.findOne({
      where: { domainName },
      relations: ['tenant', 'tenant.package'],
    });
    
    if (!domain) {
      throw new NotFoundException(`Domain ${domainName} not found`);
    }
    
    return domain.tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    // Don't allow changing the schema name
    if (updateTenantDto.schemaName && updateTenantDto.schemaName !== tenant.schemaName) {
      throw new BadRequestException('Cannot change schema name');
    }
    
    const updatedTenant = this.tenantRepository.merge(tenant, updateTenantDto);
    const savedTenant = await this.tenantRepository.save(updatedTenant);
    
    // Emit tenant updated event
    this.eventEmitter.emit('tenant.updated', {
      tenantId: savedTenant.id,
      schemaName: savedTenant.schemaName,
      packageId: savedTenant.packageId,
      timestamp: new Date(),
    });
    
    return savedTenant;
  }

  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = 'active';
    
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // Emit tenant activated event
    this.eventEmitter.emit('tenant.activated', {
      tenantId: savedTenant.id,
      schemaName: savedTenant.schemaName,
      timestamp: new Date(),
    });
    
    return savedTenant;
  }

  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = 'suspended';
    
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // Emit tenant suspended event
    this.eventEmitter.emit('tenant.suspended', {
      tenantId: savedTenant.id,
      schemaName: savedTenant.schemaName,
      timestamp: new Date(),
    });
    
    return savedTenant;
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    
    // Mark as deleted instead of actually deleting
    tenant.status = 'deleted';
    await this.tenantRepository.save(tenant);
    
    // Emit tenant deleted event
    this.eventEmitter.emit('tenant.deleted', {
      tenantId: tenant.id,
      schemaName: tenant.schemaName,
      timestamp: new Date(),
    });
  }

  async upgradePackage(id: string, packageId: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.packageId = packageId;
    
    const savedTenant = await this.tenantRepository.save(tenant);
    
    // Emit tenant package upgraded event
    this.eventEmitter.emit('tenant.package.upgraded', {
      tenantId: savedTenant.id,
      schemaName: savedTenant.schemaName,
      oldPackageId: tenant.packageId,
      newPackageId: packageId,
      timestamp: new Date(),
    });
    
    return savedTenant;
  }

  async exportTenantData(id: string): Promise<any> {
    const tenant = await this.findOne(id);
    
    // This is a placeholder - actual implementation would query the tenant schema
    // and export all relevant data
    const result = {
      tenant: tenant,
      data: {
        users: [],
        // ... other data tables from the tenant schema
      }
    };
    
    return result;
  }

  async generateDomainVerificationToken(domainId: string): Promise<string> {
    const domain = await this.domainRepository.findOne({
      where: { id: domainId },
    });
    
    if (!domain) {
      throw new NotFoundException(`Domain with ID ${domainId} not found`);
    }
    
    // Generate a random verification token
    const token = randomBytes(32).toString('hex');
    
    // Update the domain with the verification token
    domain.verificationToken = token;
    await this.domainRepository.save(domain);
    
    return token;
  }

  async verifyDomain(domainId: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { id: domainId },
    });
    
    if (!domain) {
      throw new NotFoundException(`Domain with ID ${domainId} not found`);
    }
    
    // In a real implementation, you would check if the domain actually has the verification
    // token in its DNS records or correct CNAME record
    
    // For this example, we'll just mark it as verified
    domain.status = 'active';
    return this.domainRepository.save(domain);
  }
}

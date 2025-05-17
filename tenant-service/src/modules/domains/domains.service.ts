import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Domain } from './entities/domain.entity';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { randomBytes } from 'crypto';
import * as dns from 'dns';
import { promisify } from 'util';

@Injectable()
export class DomainsService {
  private resolveTxt = promisify(dns.resolveTxt);
  private resolveCname = promisify(dns.resolveCname);

  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createDomainDto: CreateDomainDto): Promise<Domain> {
    try {
      // Check if domain name already exists
      const existingDomain = await this.domainRepository.findOne({
        where: { domainName: createDomainDto.domainName }
      });
      
      if (existingDomain) {
        throw new ConflictException(`Domain ${createDomainDto.domainName} already exists`);
      }
      
      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      
      // Create the domain
      const domain = this.domainRepository.create({
        ...createDomainDto,
        verificationToken,
      });
      
      const savedDomain = await this.domainRepository.save(domain);
      
      // Emit domain created event
      this.eventEmitter.emit('domain.created', {
        domainId: savedDomain.id,
        tenantId: savedDomain.tenantId,
        domainName: savedDomain.domainName,
        timestamp: new Date(),
      });
      
      return savedDomain;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create domain: ${error.message}`);
    }
  }

  async findAll(options?: FindOptionsWhere<Domain>): Promise<Domain[]> {
    try {
      return this.domainRepository.find({
        where: options,
        relations: ['tenant'],
        order: { domainName: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve domains: ${error.message}`);
    }
  }
  async findByTenantId(tenantId: string): Promise<Domain[]> {
    try {
      return this.domainRepository.find({
        where: { tenantId },
        relations: ['tenant'],
        order: { isDefault: 'DESC', domainName: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve domains for tenant ${tenantId}: ${error.message}`);
    }
  }
  
  async findByDomainName(domainName: string): Promise<Domain> {
    try {
      const domain = await this.domainRepository.findOne({
        where: { domainName },
        relations: ['tenant'],
      });
      
      if (!domain) {
        throw new NotFoundException(`Domain with name ${domainName} not found`);
      }
      
      return domain;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve domain by name: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Domain> {
    try {
      const domain = await this.domainRepository.findOne({
        where: { id },
        relations: ['tenant'],
      });
      
      if (!domain) {
        throw new NotFoundException(`Domain with ID ${id} not found`);
      }
      
      return domain;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve domain: ${error.message}`);
    }
  }

  async update(id: string, updateDomainDto: UpdateDomainDto): Promise<Domain> {
    try {
      const domain = await this.findOne(id);
      
      // If updating domain name, check if it already exists
      if (updateDomainDto.domainName && updateDomainDto.domainName !== domain.domainName) {
        const existingDomain = await this.domainRepository.findOne({
          where: { domainName: updateDomainDto.domainName }
        });
        
        if (existingDomain) {
          throw new ConflictException(`Domain ${updateDomainDto.domainName} already exists`);
        }
      }
      
      const updatedDomain = this.domainRepository.merge(domain, updateDomainDto);
      const savedDomain = await this.domainRepository.save(updatedDomain);
      
      // Emit domain updated event
      this.eventEmitter.emit('domain.updated', {
        domainId: savedDomain.id,
        tenantId: savedDomain.tenantId,
        domainName: savedDomain.domainName,
        timestamp: new Date(),
      });
      
      return savedDomain;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update domain: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const domain = await this.findOne(id);
      
      // Don't delete default domains
      if (domain.isDefault) {
        throw new ConflictException('Cannot delete the default domain');
      }
      
      await this.domainRepository.remove(domain);
      
      // Emit domain deleted event
      this.eventEmitter.emit('domain.deleted', {
        domainId: domain.id,
        tenantId: domain.tenantId,
        domainName: domain.domainName,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete domain: ${error.message}`);
    }
  }

  async setAsDefault(id: string): Promise<Domain> {
    try {
      const domain = await this.findOne(id);
      
      // Don't do anything if it's already the default
      if (domain.isDefault) {
        return domain;
      }
      
      // Begin transaction to ensure atomic operation
      const queryRunner = this.domainRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      try {
        // Remove default flag from other domains of the same tenant
        await queryRunner.manager.update(
          Domain,
          { tenantId: domain.tenantId, isDefault: true },
          { isDefault: false }
        );
        
        // Set this domain as default
        domain.isDefault = true;
        const savedDomain = await queryRunner.manager.save(domain);
        
        await queryRunner.commitTransaction();
        
        // Emit domain set as default event
        this.eventEmitter.emit('domain.setAsDefault', {
          domainId: domain.id,
          tenantId: domain.tenantId,
          domainName: domain.domainName,
          timestamp: new Date(),
        });
        
        return savedDomain;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to set domain as default: ${error.message}`);
    }
  }

  async verifyDomain(id: string): Promise<Domain> {
    try {
      const domain = await this.findOne(id);
      
      if (domain.status === 'active') {
        return domain; // Already verified
      }
      
      let isVerified = false;
      
      // Perform verification based on method
      try {
        if (domain.verificationMethod === 'txt') {
          const records = await this.resolveTxt(`_tenantverify.${domain.domainName}`);
          isVerified = records.some(record => record.includes(domain.verificationToken));
        } else if (domain.verificationMethod === 'cname') {
          const record = await this.resolveCname(`_tenantverify.${domain.domainName}`);
          isVerified = record.includes(domain.verificationToken);
        }
      } catch (err) {
        // DNS resolution errors are expected if records don't exist
        isVerified = false;
      }
      
      if (isVerified) {
        domain.status = 'active';
        const savedDomain = await this.domainRepository.save(domain);
        
        // Emit domain verified event
        this.eventEmitter.emit('domain.verified', {
          domainId: domain.id,
          tenantId: domain.tenantId,
          domainName: domain.domainName,
          timestamp: new Date(),
        });
        
        return savedDomain;
      } else {
        throw new BadRequestException('Domain verification failed. DNS records not found or not matching.');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to verify domain: ${error.message}`);
    }
  }

  async getVerificationDetails(id: string): Promise<{
    domain: string;
    method: string;
    record: string;
    value: string;
  }> {
    try {
      const domain = await this.findOne(id);
      
      if (domain.verificationMethod === 'txt') {
        return {
          domain: domain.domainName,
          method: 'TXT',
          record: `_tenantverify.${domain.domainName}`,
          value: domain.verificationToken,
        };
      } else if (domain.verificationMethod === 'cname') {
        return {
          domain: domain.domainName,
          method: 'CNAME',
          record: `_tenantverify.${domain.domainName}`,
          value: `verify.${domain.tenantId}.tenants.example.com`,
        };
      } else {
        throw new BadRequestException('Unsupported verification method');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get verification details: ${error.message}`);
    }
  }
}

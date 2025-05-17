import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpCode, 
  HttpStatus,
  BadRequestException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBody 
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { Domain } from '../domains/entities/domain.entity';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'The tenant has been successfully created.', type: Tenant })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Tenant with this schema name already exists' })
  @ApiBody({ type: CreateTenantDto })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all tenants or filter by package ID' })
  @ApiResponse({ status: 200, description: 'Return all tenants.', type: [Tenant] })
  @ApiQuery({ name: 'packageId', required: false, description: 'Filter tenants by package ID' })
  async findAll(@Query('packageId') packageId?: string): Promise<Tenant[]> {
    if (packageId) {
      return this.tenantsService.findByPackageId(packageId);
    }
    return this.tenantsService.findAll();
  }
  @Get('schema/:schemaName')
  @ApiOperation({ summary: 'Find a tenant by schema name' })
  @ApiResponse({ status: 200, description: 'Return the tenant.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'schemaName', description: 'The tenant schema name' })
  async findBySchemaName(@Param('schemaName') schemaName: string): Promise<Tenant> {
    return this.tenantsService.findBySchemaName(schemaName);
  }

  @Get('domain/:domainName')
  @ApiOperation({ summary: 'Find a tenant by domain name' })
  @ApiResponse({ status: 200, description: 'Return the tenant.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'domainName', description: 'The domain name' })
  async findByDomain(@Param('domainName') domainName: string): Promise<Tenant> {
    return this.tenantsService.findByDomain(domainName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a tenant by ID' })
  @ApiResponse({ status: 200, description: 'Return the tenant.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully updated.', type: Tenant })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  @ApiBody({ type: UpdateTenantDto })
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Mark a tenant as deleted' })
  @ApiResponse({ status: 204, description: 'The tenant has been successfully marked as deleted.' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a tenant' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully activated.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  async activate(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.activate(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a tenant' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully suspended.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  async suspend(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/upgrade-package/:packageId')
  @ApiOperation({ summary: 'Upgrade a tenant to a new package' })
  @ApiResponse({ status: 200, description: 'The tenant has been successfully upgraded.', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant or package not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  @ApiParam({ name: 'packageId', description: 'The new package ID' })
  async upgradePackage(
    @Param('id') id: string,
    @Param('packageId') packageId: string,
  ): Promise<Tenant> {
    return this.tenantsService.upgradePackage(id, packageId);
  }

  @Get(':id/export-data')
  @ApiOperation({ summary: 'Export all tenant data' })
  @ApiResponse({ status: 200, description: 'Return the tenant data.' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'id', description: 'The tenant ID' })
  async exportData(@Param('id') id: string): Promise<any> {
    return this.tenantsService.exportTenantData(id);
  }

  @Post('domains/:domainId/generate-verification')
  @ApiOperation({ summary: 'Generate a domain verification token' })
  @ApiResponse({ status: 200, description: 'Return the verification token.' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'domainId', description: 'The domain ID' })
  async generateDomainVerification(@Param('domainId') domainId: string): Promise<{ token: string }> {
    const token = await this.tenantsService.generateDomainVerificationToken(domainId);
    return { token };
  }

  @Post('domains/:domainId/verify')
  @ApiOperation({ summary: 'Verify a domain' })
  @ApiResponse({ status: 200, description: 'The domain has been successfully verified.', type: Domain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'domainId', description: 'The domain ID' })
  async verifyDomain(@Param('domainId') domainId: string): Promise<Domain> {
    return this.tenantsService.verifyDomain(domainId);
  }
}

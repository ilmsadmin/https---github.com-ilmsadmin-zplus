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
  ConflictException,
  Put
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBody 
} from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { Domain } from './entities/domain.entity';

@ApiTags('domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: 201, description: 'The domain has been successfully created.', type: Domain })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Domain already exists' })
  @ApiBody({ type: CreateDomainDto })
  async create(@Body() createDomainDto: CreateDomainDto): Promise<Domain> {
    return this.domainsService.create(createDomainDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all domains or filter by tenant ID' })
  @ApiResponse({ status: 200, description: 'Return all domains.', type: [Domain] })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter domains by tenant ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter domains by status' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string
  ): Promise<Domain[]> {
    if (tenantId) {
      if (status) {
        return this.domainsService.findAll({ tenantId, status });
      }
      return this.domainsService.findByTenantId(tenantId);
    }
    if (status) {
      return this.domainsService.findAll({ status });
    }
    return this.domainsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find a domain by ID' })
  @ApiResponse({ status: 200, description: 'Return the domain.', type: Domain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  async findOne(@Param('id') id: string): Promise<Domain> {
    return this.domainsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a domain' })
  @ApiResponse({ status: 200, description: 'The domain has been successfully updated.', type: Domain })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiResponse({ status: 409, description: 'Domain name already exists' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  @ApiBody({ type: UpdateDomainDto })
  async update(
    @Param('id') id: string, 
    @Body() updateDomainDto: UpdateDomainDto
  ): Promise<Domain> {
    return this.domainsService.update(id, updateDomainDto);
  }

  @Put(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a domain as the default domain for a tenant' })
  @ApiResponse({ status: 200, description: 'The domain has been set as default.', type: Domain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  async setAsDefault(@Param('id') id: string): Promise<Domain> {
    return this.domainsService.setAsDefault(id);
  }

  @Put(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify domain ownership' })
  @ApiResponse({ status: 200, description: 'The domain has been verified.', type: Domain })
  @ApiResponse({ status: 400, description: 'Verification failed' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  async verifyDomain(@Param('id') id: string): Promise<Domain> {
    return this.domainsService.verifyDomain(id);
  }

  @Get(':id/verification-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get domain verification details' })
  @ApiResponse({ 
    status: 200, 
    description: 'The domain verification details.',
    schema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
        method: { type: 'string' },
        record: { type: 'string' },
        value: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  async getVerificationDetails(@Param('id') id: string): Promise<{
    domain: string;
    method: string;
    record: string;
    value: string;
  }> {
    return this.domainsService.getVerificationDetails(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a domain' })
  @ApiResponse({ status: 204, description: 'The domain has been successfully deleted.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete the default domain' })
  @ApiParam({ name: 'id', description: 'The domain ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.domainsService.remove(id);
  }
}

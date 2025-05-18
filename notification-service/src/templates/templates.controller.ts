import { Controller, Get, Post, Body, Param, Put, Delete, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TenantIdFromReq } from '../common/decorators/tenant-id.decorator';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  private readonly logger = new Logger(TemplatesController.name);

  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({ status: 201, description: 'The template has been successfully created.', type: Template })
  async create(@Body() createTemplateDto: CreateTemplateDto, @TenantIdFromReq() tenantId: string): Promise<Template> {
    // Inject tenant ID from request context if not provided in DTO
    if (!createTemplateDto.tenantId) {
      createTemplateDto.tenantId = tenantId;
    }
    
    this.logger.log(`Creating template for tenant ${createTemplateDto.tenantId}`);
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates for the tenant' })
  @ApiResponse({ status: 200, description: 'Return all templates.', type: [Template] })
  async findAll(@TenantIdFromReq() tenantId: string): Promise<Template[]> {
    this.logger.log(`Retrieving templates for tenant ${tenantId}`);
    return this.templatesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Return the template.', type: Template })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async findOne(@Param('id') id: string, @TenantIdFromReq() tenantId: string): Promise<Template> {
    this.logger.log(`Retrieving template ${id} for tenant ${tenantId}`);
    return this.templatesService.findById(id, tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a template by code' })
  @ApiParam({ name: 'code', description: 'Template code' })
  @ApiResponse({ status: 200, description: 'Return the template.', type: Template })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async findByCode(@Param('code') code: string, @TenantIdFromReq() tenantId: string): Promise<Template> {
    this.logger.log(`Retrieving template with code ${code} for tenant ${tenantId}`);
    return this.templatesService.findByCode(code, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'The template has been successfully updated.', type: Template })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async update(
    @Param('id') id: string, 
    @Body() updateTemplateDto: Partial<CreateTemplateDto>,
    @TenantIdFromReq() tenantId: string
  ): Promise<Template> {
    this.logger.log(`Updating template ${id} for tenant ${tenantId}`);
    return this.templatesService.update(id, updateTemplateDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'The template has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async remove(@Param('id') id: string, @TenantIdFromReq() tenantId: string): Promise<void> {
    this.logger.log(`Deleting template ${id} for tenant ${tenantId}`);
    return this.templatesService.remove(id, tenantId);
  }
}

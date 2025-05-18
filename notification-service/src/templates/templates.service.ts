import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Handlebars } from 'handlebars';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private handlebars = new Handlebars();

  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create(createTemplateDto);
    const savedTemplate = await this.templateRepository.save(template);
    
    this.logger.log(`Created template with ID: ${savedTemplate.id}`);
    return savedTemplate;
  }

  async findAll(tenantId: string): Promise<Template[]> {
    return this.templateRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, tenantId?: string): Promise<Template> {
    const queryOptions: any = { where: { id } };
    
    if (tenantId) {
      queryOptions.where.tenantId = tenantId;
    }
    
    const template = await this.templateRepository.findOne(queryOptions);
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return template;
  }

  async findByCode(code: string, tenantId: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { code, tenantId },
    });
    
    if (!template) {
      throw new NotFoundException(`Template with code ${code} not found for tenant ${tenantId}`);
    }
    
    return template;
  }

  async update(id: string, updateTemplateDto: Partial<CreateTemplateDto>, tenantId?: string): Promise<Template> {
    const template = await this.findById(id, tenantId);
    
    Object.assign(template, updateTemplateDto);
    const updatedTemplate = await this.templateRepository.save(template);
    
    this.logger.log(`Updated template with ID: ${updatedTemplate.id}`);
    return updatedTemplate;
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const template = await this.findById(id, tenantId);
    
    await this.templateRepository.remove(template);
    this.logger.log(`Removed template with ID: ${id}`);
  }

  async renderTemplate(template: Template, variables: Record<string, any>): Promise<{
    subject?: string;
    content?: string;
    htmlContent?: string;
    textContent?: string;
    title?: string;
    body?: string;
  }> {
    // Merge default variables with provided variables
    const mergedVariables = {
      ...template.defaultVariables,
      ...variables,
    };
    
    const result: any = {};
    
    // Render different content types based on template fields
    if (template.emailSubject) {
      result.subject = this.renderString(template.emailSubject, mergedVariables);
    }
    
    if (template.emailHtmlContent) {
      result.htmlContent = this.renderString(template.emailHtmlContent, mergedVariables);
      result.content = result.htmlContent; // Use HTML as default content
    }
    
    if (template.emailTextContent) {
      result.textContent = this.renderString(template.emailTextContent, mergedVariables);
      if (!result.content) {
        result.content = result.textContent;
      }
    }
    
    if (template.pushTitle) {
      result.title = this.renderString(template.pushTitle, mergedVariables);
    }
    
    if (template.pushBody) {
      result.body = this.renderString(template.pushBody, mergedVariables);
    }
    
    if (template.smsContent) {
      const smsContent = this.renderString(template.smsContent, mergedVariables);
      if (!result.content) {
        result.content = smsContent;
      }
    }
    
    if (template.inAppTitle && !result.title) {
      result.title = this.renderString(template.inAppTitle, mergedVariables);
    }
    
    if (template.inAppContent && !result.content) {
      result.content = this.renderString(template.inAppContent, mergedVariables);
    }
    
    return result;
  }

  private renderString(template: string, variables: Record<string, any>): string {
    try {
      const compiledTemplate = this.handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      this.logger.error(`Error rendering template: ${error.message}`, error.stack);
      return template; // Return original template on error
    }
  }

  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      
      // Simple date formatting - in a real app, use a proper date library
      const d = new Date(date);
      return d.toLocaleDateString();
    });
    
    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', function(value, currency = 'USD') {
      if (isNaN(value)) return '';
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(value);
    });
    
    // Conditional helper
    this.handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }
}

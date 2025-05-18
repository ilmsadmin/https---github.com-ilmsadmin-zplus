import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatesService } from '../src/templates/templates.service';
import { Template } from '../src/templates/entities/template.entity';
import { CreateTemplateDto } from '../src/templates/dto/create-template.dto';
import { NotFoundException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateRepository: Repository<Template>;

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(Template),
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateRepository = module.get<Repository<Template>>(getRepositoryToken(Template));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const createTemplateDto: CreateTemplateDto = {
        name: 'Test Template',
        code: 'TEST_TEMPLATE',
        subject: 'Test Subject',
        content: 'Hello {{name}}',
        description: 'A test template',
        tenantId: 'tenant-123',
        categoryCode: 'general',
        metadata: { sender: 'test@example.com' }
      };

      const savedTemplate = {
        id: 'template-1',
        ...createTemplateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.create.mockReturnValue(createTemplateDto);
      mockTemplateRepository.save.mockResolvedValue(savedTemplate);

      const result = await service.create(createTemplateDto);

      expect(mockTemplateRepository.create).toHaveBeenCalledWith(createTemplateDto);
      expect(mockTemplateRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedTemplate);
    });
  });

  describe('findAll', () => {
    it('should return an array of templates for a tenant', async () => {
      const tenantId = 'tenant-123';
      const templates = [
        {
          id: 'template-1',
          name: 'Template 1',
          code: 'TEMPLATE_1',
          subject: 'Subject 1',
          content: 'Content 1',
          tenantId,
          categoryCode: 'general',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template-2',
          name: 'Template 2',
          code: 'TEMPLATE_2',
          subject: 'Subject 2',
          content: 'Content 2',
          tenantId,
          categoryCode: 'general',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(templates);

      const result = await service.findAll(tenantId);

      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(result).toEqual(templates);
    });
  });

  describe('findById', () => {
    it('should return a template by id', async () => {
      const id = 'template-1';
      const tenantId = 'tenant-123';
      const template = {
        id,
        name: 'Template 1',
        code: 'TEMPLATE_1',
        subject: 'Subject 1',
        content: 'Content 1',
        tenantId,
        categoryCode: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.findOne.mockResolvedValue(template);

      const result = await service.findById(id, tenantId);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
      });
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found', async () => {
      const id = 'non-existent-id';
      const tenantId = 'tenant-123';

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(id, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a template by code', async () => {
      const code = 'TEMPLATE_CODE';
      const tenantId = 'tenant-123';
      const template = {
        id: 'template-1',
        name: 'Template 1',
        code,
        subject: 'Subject 1',
        content: 'Content 1',
        tenantId,
        categoryCode: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.findOne.mockResolvedValue(template);

      const result = await service.findByCode(code, tenantId);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { code, tenantId },
      });
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found by code', async () => {
      const code = 'NON_EXISTENT_CODE';
      const tenantId = 'tenant-123';

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode(code, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const id = 'template-1';
      const tenantId = 'tenant-123';
      const updateTemplateDto = {
        name: 'Updated Template',
        subject: 'Updated Subject',
        content: 'Updated content with {{variable}}',
      };

      const existingTemplate = {
        id,
        name: 'Old Template',
        code: 'TEMPLATE_CODE',
        subject: 'Old Subject',
        content: 'Old content',
        tenantId,
        categoryCode: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTemplate = {
        ...existingTemplate,
        ...updateTemplateDto,
        updatedAt: expect.any(Date),
      };

      mockTemplateRepository.findOne.mockResolvedValue(existingTemplate);
      mockTemplateRepository.save.mockResolvedValue(updatedTemplate);

      const result = await service.update(id, tenantId, updateTemplateDto);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
      });
      expect(mockTemplateRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedTemplate);
    });

    it('should throw NotFoundException if template to update is not found', async () => {
      const id = 'non-existent-id';
      const tenantId = 'tenant-123';
      const updateTemplateDto = { name: 'Updated Template' };

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, tenantId, updateTemplateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      const id = 'template-1';
      const tenantId = 'tenant-123';
      const template = {
        id,
        name: 'Template 1',
        code: 'TEMPLATE_CODE',
        tenantId,
      };

      mockTemplateRepository.findOne.mockResolvedValue(template);
      mockTemplateRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(id, tenantId);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
      });
      expect(mockTemplateRepository.delete).toHaveBeenCalledWith({ id, tenantId });
    });

    it('should throw NotFoundException if template to delete is not found', async () => {
      const id = 'non-existent-id';
      const tenantId = 'tenant-123';

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id, tenantId)).rejects.toThrow(NotFoundException);
    });
  });
});

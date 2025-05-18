import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ModuleDependenciesService } from './module-dependencies.service';
import { CreateModuleDependencyDto } from './dto/create-module-dependency.dto';
import { UpdateModuleDependencyDto } from './dto/update-module-dependency.dto';
import { ModuleDependency } from './entities/module-dependency.entity';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';

@ApiTags('module-dependencies')
@Controller('module-dependencies')
@UseGuards(TenantAuthGuard)
export class ModuleDependenciesController {
  private readonly logger = new Logger(ModuleDependenciesController.name);

  constructor(private readonly dependenciesService: ModuleDependenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new module dependency' })
  @ApiResponse({ status: 201, description: 'The dependency has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Circular dependency detected.' })
  async create(@Body() createDto: CreateModuleDependencyDto): Promise<ModuleDependency> {
    this.logger.log(`Creating dependency: ${JSON.stringify(createDto)}`);
    return this.dependenciesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all module dependencies' })
  @ApiResponse({ status: 200, description: 'Return all dependencies.' })
  async findAll(): Promise<ModuleDependency[]> {
    return this.dependenciesService.findAll();
  }

  @Get('version/:id')
  @ApiOperation({ summary: 'Get all dependencies for a specific module version' })
  @ApiParam({ name: 'id', description: 'The ID of the module version' })
  @ApiResponse({ status: 200, description: 'Return dependencies for the specified version.' })
  async findByDependentVersionId(@Param('id') id: string): Promise<ModuleDependency[]> {
    return this.dependenciesService.findByDependentVersionId(id);
  }

  @Get('module/:id')
  @ApiOperation({ summary: 'Get all dependencies on a specific module' })
  @ApiParam({ name: 'id', description: 'The ID of the dependency module' })
  @ApiResponse({ status: 200, description: 'Return dependencies on the specified module.' })
  async findByDependencyModuleId(@Param('id') id: string): Promise<ModuleDependency[]> {
    return this.dependenciesService.findByDependencyModuleId(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific module dependency by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the dependency' })
  @ApiResponse({ status: 200, description: 'Return the dependency.' })
  @ApiResponse({ status: 404, description: 'Dependency not found.' })
  async findOne(@Param('id') id: string): Promise<ModuleDependency> {
    return this.dependenciesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a module dependency' })
  @ApiParam({ name: 'id', description: 'The ID of the dependency to update' })
  @ApiResponse({ status: 200, description: 'The dependency has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Dependency not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateModuleDependencyDto,
  ): Promise<ModuleDependency> {
    this.logger.log(`Updating dependency ${id}: ${JSON.stringify(updateDto)}`);
    return this.dependenciesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a module dependency' })
  @ApiParam({ name: 'id', description: 'The ID of the dependency to delete' })
  @ApiResponse({ status: 200, description: 'The dependency has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Dependency not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting dependency ${id}`);
    return this.dependenciesService.remove(id);
  }
}

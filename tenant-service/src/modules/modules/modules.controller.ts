import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpStatus, 
  HttpCode,
  Query,
  Put
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { Module } from './entities/module.entity';

@ApiTags('modules')
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new module' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The module has been successfully created.',
    type: Module
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'A module with the same name already exists.' 
  })
  create(@Body() createModuleDto: CreateModuleDto): Promise<Module> {
    return this.modulesService.create(createModuleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all modules' })
  @ApiQuery({ 
    name: 'name', 
    required: false, 
    description: 'Filter modules by name' 
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    description: 'Filter modules by active status' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of all modules.',
    type: [Module]
  })
  findAll(
    @Query('name') name?: string,
    @Query('isActive') isActive?: boolean
  ): Promise<Module[]> {
    const filter: any = {};
    if (name) filter.name = name;
    if (isActive !== undefined) filter.isActive = isActive;
    
    return this.modulesService.findAll(Object.keys(filter).length ? filter : undefined);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a module by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the module' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The found module.',
    type: Module
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Module not found.' 
  })
  findOne(@Param('id') id: string): Promise<Module> {
    return this.modulesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'id', description: 'The ID of the module to update' })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module has been successfully updated.',
    type: Module
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Module not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  update(
    @Param('id') id: string, 
    @Body() updateModuleDto: UpdateModuleDto
  ): Promise<Module> {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a module' })
  @ApiParam({ name: 'id', description: 'The ID of the module to activate' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module has been successfully activated.',
    type: Module 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Module not found.' 
  })
  activate(@Param('id') id: string): Promise<Module> {
    return this.modulesService.activate(id);
  }

  @Put(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a module' })
  @ApiParam({ name: 'id', description: 'The ID of the module to deactivate' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The module has been successfully deactivated.',
    type: Module 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Module not found.' 
  })
  deactivate(@Param('id') id: string): Promise<Module> {
    return this.modulesService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a module' })
  @ApiParam({ name: 'id', description: 'The ID of the module to delete' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'The module has been successfully deleted.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Module not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot delete module that is associated with tenants.' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.modulesService.remove(id);
  }
}

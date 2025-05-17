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
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package } from './entities/package.entity';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new package' })
  @ApiBody({ type: CreatePackageDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The package has been successfully created.',
    type: Package
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'A package with the same name already exists.' 
  })
  create(@Body() createPackageDto: CreatePackageDto): Promise<Package> {
    return this.packagesService.create(createPackageDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all packages' })
  @ApiQuery({ 
    name: 'name', 
    required: false, 
    description: 'Filter packages by name' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of all packages.',
    type: [Package]
  })
  findAll(@Query('name') name?: string): Promise<Package[]> {
    const filter = name ? { name } : undefined;
    return this.packagesService.findAll(filter);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a package by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the package' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The found package.',
    type: Package
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Package not found.' 
  })
  findOne(@Param('id') id: string): Promise<Package> {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a package' })
  @ApiParam({ name: 'id', description: 'The ID of the package to update' })
  @ApiBody({ type: UpdatePackageDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The package has been successfully updated.',
    type: Package
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Package not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  update(
    @Param('id') id: string, 
    @Body() updatePackageDto: UpdatePackageDto
  ): Promise<Package> {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a package' })
  @ApiParam({ name: 'id', description: 'The ID of the package to delete' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'The package has been successfully deleted.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Package not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot delete package that is associated with tenants.' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.packagesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { TenantContext } from '../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The contact has been successfully created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  create(
    @Body() createContactDto: CreateContactDto,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.create(createContactDto, tenantContext);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of contacts' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  findAll(
    @TenantContext() tenantContext: ITenantContext,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
  ) {
    return this.contactsService.findAll(tenantContext, { ownerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The contact' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contact not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.findOne(id, tenantContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The contact has been successfully updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contact not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.update(id, updateContactDto, tenantContext);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The contact has been successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contact not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.remove(id, tenantContext);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add an activity to a contact' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The activity has been successfully created' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contact not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() activityData: any,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.addActivity(id, activityData, tenantContext);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities for a contact' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of activities' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contact not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getActivities(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantContext() tenantContext: ITenantContext,
  ) {
    return this.contactsService.getActivities(id, tenantContext);
  }
}

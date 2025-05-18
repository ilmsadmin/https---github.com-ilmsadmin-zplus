import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { TenantAuthGuard } from '../../common/guards/tenant-auth.guard';
import { TenantContext } from '../../common/decorators/tenant-context.decorator';
import { ITenantContext } from '../../common/interfaces/tenant-context.interface';

@ApiTags('employees')
@Controller('employees')
@UseGuards(TenantAuthGuard)
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'The employee has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Employee with the same email already exists.' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee> {
    this.logger.log(`Creating employee for tenant ${tenantContext.tenantId}`);
    return this.employeesService.create(createEmployeeDto, tenantContext.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ status: 200, description: 'Return all employees for the tenant.' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by employee status' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'Filter by department ID' })
  async findAll(
    @TenantContext() tenantContext: ITenantContext,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ): Promise<Employee[]> {
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (departmentId) {
      filters.departmentId = departmentId;
    }
    
    return this.employeesService.findAll(tenantContext.tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the employee' })
  @ApiResponse({ status: 200, description: 'Return the employee.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async findOne(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee> {
    return this.employeesService.findOne(id, tenantContext.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiParam({ name: 'id', description: 'The ID of the employee to update' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee> {
    this.logger.log(`Updating employee ${id} for tenant ${tenantContext.tenantId}`);
    return this.employeesService.update(id, updateEmployeeDto, tenantContext.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'The ID of the employee to delete' })
  @ApiResponse({ status: 200, description: 'The employee has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  async remove(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<void> {
    this.logger.log(`Deleting employee ${id} for tenant ${tenantContext.tenantId}`);
    return this.employeesService.remove(id, tenantContext.tenantId);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get employees by department' })
  @ApiParam({ name: 'departmentId', description: 'The ID of the department' })
  @ApiResponse({ status: 200, description: 'Return employees in the specified department.' })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee[]> {
    return this.employeesService.findByDepartment(departmentId, tenantContext.tenantId);
  }

  @Get('manager/:managerId')
  @ApiOperation({ summary: 'Get employees by manager' })
  @ApiParam({ name: 'managerId', description: 'The ID of the manager' })
  @ApiResponse({ status: 200, description: 'Return employees under the specified manager.' })
  async findByManager(
    @Param('managerId') managerId: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee[]> {
    return this.employeesService.findByManager(managerId, tenantContext.tenantId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get employees by status' })
  @ApiParam({ name: 'status', description: 'The employee status (active, on-leave, terminated, etc.)' })
  @ApiResponse({ status: 200, description: 'Return employees with the specified status.' })
  async findByStatus(
    @Param('status') status: string,
    @TenantContext() tenantContext: ITenantContext,
  ): Promise<Employee[]> {
    return this.employeesService.findByStatus(status, tenantContext.tenantId);
  }
}

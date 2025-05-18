import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, tenantId: string): Promise<Employee> {
    this.logger.log(`Creating employee for tenant ${tenantId}`);
    
    // Check if email is already in use within this tenant
    const existingEmployee = await this.employeeRepository.findOne({
      where: { 
        email: createEmployeeDto.email,
        tenantId,
      },
    });
    
    if (existingEmployee) {
      throw new ConflictException(`Employee with email ${createEmployeeDto.email} already exists`);
    }
    
    // Create the employee
    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      tenantId,
    });
    
    const result = await this.employeeRepository.save(employee);
    
    // Emit event for employee creation
    this.eventEmitter.emit('employee.created', result);
    
    return result;
  }

  async findAll(tenantId: string, options?: FindOptionsWhere<Employee>): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: {
        tenantId,
        ...options,
      },
      relations: ['department', 'position', 'manager'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, tenantId },
      relations: ['department', 'position', 'manager', 'subordinates', 'documents', 'leaves', 'performanceReviews'],
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, tenantId: string): Promise<Employee> {
    this.logger.log(`Updating employee ${id} for tenant ${tenantId}`);
    
    // Find the employee
    const employee = await this.findOne(id, tenantId);
    
    // Check if email is being updated and is already in use
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { 
          email: updateEmployeeDto.email,
          tenantId,
        },
      });
      
      if (existingEmployee && existingEmployee.id !== id) {
        throw new ConflictException(`Employee with email ${updateEmployeeDto.email} already exists`);
      }
    }
    
    // Update the employee
    const updatedEmployee = await this.employeeRepository.save({
      ...employee,
      ...updateEmployeeDto,
    });
    
    // Emit event for employee update
    this.eventEmitter.emit('employee.updated', updatedEmployee);
    
    return updatedEmployee;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Removing employee ${id} for tenant ${tenantId}`);
    
    // Find the employee
    const employee = await this.findOne(id, tenantId);
    
    // Delete the employee
    await this.employeeRepository.remove(employee);
    
    // Emit event for employee deletion
    this.eventEmitter.emit('employee.deleted', { id, tenantId });
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { 
        departmentId,
        tenantId,
      },
      relations: ['position'],
    });
  }

  async findByManager(managerId: string, tenantId: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { 
        managerId,
        tenantId,
      },
      relations: ['position', 'department'],
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { 
        status,
        tenantId,
      },
      relations: ['position', 'department'],
    });
  }
}

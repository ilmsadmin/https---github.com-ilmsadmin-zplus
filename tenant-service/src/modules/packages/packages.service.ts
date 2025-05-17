import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Package } from './entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createPackageDto: CreatePackageDto): Promise<Package> {
    try {
      // Check if package with same name already exists
      const existingPackage = await this.packageRepository.findOne({
        where: { name: createPackageDto.name }
      });

      if (existingPackage) {
        throw new ConflictException(`Package with name "${createPackageDto.name}" already exists`);
      }

      // Create and save the new package
      const newPackage = this.packageRepository.create(createPackageDto);
      const savedPackage = await this.packageRepository.save(newPackage);

      // Emit event for package creation
      this.eventEmitter.emit('package.created', savedPackage);

      return savedPackage;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create package: ${error.message}`);
    }
  }

  async findAll(options?: FindOptionsWhere<Package>): Promise<Package[]> {
    try {
      return await this.packageRepository.find({
        where: options,
        order: { name: 'ASC' }
      });
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve packages: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Package> {
    try {
      const foundPackage = await this.packageRepository.findOne({
        where: { id },
        relations: ['tenants']
      });

      if (!foundPackage) {
        throw new NotFoundException(`Package with ID "${id}" not found`);
      }

      return foundPackage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve package: ${error.message}`);
    }
  }

  async update(id: string, updatePackageDto: UpdatePackageDto): Promise<Package> {
    try {
      // Check if package exists
      const existingPackage = await this.findOne(id);

      // If updating name, check if new name already exists in another package
      if (updatePackageDto.name && updatePackageDto.name !== existingPackage.name) {
        const nameExists = await this.packageRepository.findOne({
          where: { name: updatePackageDto.name }
        });

        if (nameExists) {
          throw new ConflictException(`Package with name "${updatePackageDto.name}" already exists`);
        }
      }

      // Update the package
      await this.packageRepository.update(id, updatePackageDto);
      
      // Retrieve and return the updated package
      const updatedPackage = await this.findOne(id);
      
      // Emit event for package update
      this.eventEmitter.emit('package.updated', updatedPackage);
      
      return updatedPackage;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update package: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if package exists
      const packageToRemove = await this.findOne(id);
      
      // Check if package has associated tenants
      if (packageToRemove.tenants && packageToRemove.tenants.length > 0) {
        throw new BadRequestException(
          `Cannot delete package with ID "${id}" because it is associated with ${packageToRemove.tenants.length} tenant(s)`
        );
      }
      
      // Delete the package
      const result = await this.packageRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Package with ID "${id}" not found`);
      }
      
      // Emit event for package deletion
      this.eventEmitter.emit('package.deleted', { id, name: packageToRemove.name });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete package: ${error.message}`);
    }
  }
}

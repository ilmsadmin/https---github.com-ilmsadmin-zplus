import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleInstallation } from './entities/module-installation.entity';
import { InstallModuleDto } from './dto/install-module.dto';
import { UpdateModuleInstallationDto } from './dto/update-installation.dto';
import { ModulesService } from '../modules/modules.service';
import { ModuleVersionsService } from '../module-versions/module-versions.service';
import { CompatibilityCheckService } from '../compatibility-check/compatibility-check.service';

@Injectable()
export class ModuleInstallationsService {
  constructor(
    @InjectRepository(ModuleInstallation)
    private readonly installationRepository: Repository<ModuleInstallation>,
    private readonly modulesService: ModulesService,
    private readonly moduleVersionsService: ModuleVersionsService,
    private readonly compatibilityCheckService: CompatibilityCheckService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async install(installModuleDto: InstallModuleDto): Promise<ModuleInstallation> {
    // Verify that the module exists
    const module = await this.modulesService.findOne(installModuleDto.moduleId);

    // Verify that the module is active
    if (!module.isActive) {
      throw new BadRequestException(`Module ${module.name} is not active`);
    }

    // Verify that the module version exists
    const moduleVersion = await this.moduleVersionsService.findOne(installModuleDto.moduleVersionId);

    // Verify that the module version belongs to the specified module
    if (moduleVersion.moduleId !== module.id) {
      throw new BadRequestException(`Version does not belong to module ${module.name}`);
    }

    // Verify that the module version is active
    if (!moduleVersion.isActive) {
      throw new BadRequestException(`Version ${moduleVersion.version} is not active`);
    }

    // Check if the module is already installed for this tenant
    const existingInstallation = await this.installationRepository.findOne({
      where: {
        tenantId: installModuleDto.tenantId,
        moduleId: installModuleDto.moduleId,
        status: 'active',
      } as FindOptionsWhere<ModuleInstallation>,
    });

    if (existingInstallation) {
      throw new ConflictException(`Module ${module.name} is already installed for this tenant`);
    }

    // Check compatibility with other installed modules
    await this.compatibilityCheckService.checkCompatibility(
      installModuleDto.tenantId,
      installModuleDto.moduleId,
      installModuleDto.moduleVersionId,
    );

    // Create installation record
    const installation = this.installationRepository.create({
      ...installModuleDto,
      status: 'active',
    });

    const savedInstallation = await this.installationRepository.save(installation);

    // Emit event
    this.eventEmitter.emit('module.installed', {
      tenantId: installModuleDto.tenantId,
      moduleId: module.id,
      moduleName: module.name,
      moduleVersionId: moduleVersion.id,
      moduleVersion: moduleVersion.version,
      installationId: savedInstallation.id,
      installedBy: installModuleDto.installedBy,
    });

    return savedInstallation;
  }

  async findAll(tenantId: string): Promise<ModuleInstallation[]> {
    return this.installationRepository.find({
      where: { tenantId } as FindOptionsWhere<ModuleInstallation>,
    });
  }

  async findOne(id: string): Promise<ModuleInstallation> {
    const installation = await this.installationRepository.findOne({
      where: { id } as FindOptionsWhere<ModuleInstallation>,
    });

    if (!installation) {
      throw new NotFoundException(`Module installation with ID ${id} not found`);
    }

    return installation;
  }

  async findByTenantAndModule(tenantId: string, moduleId: string): Promise<ModuleInstallation> {
    const installation = await this.installationRepository.findOne({
      where: {
        tenantId,
        moduleId,
        status: 'active',
      } as FindOptionsWhere<ModuleInstallation>,
    });

    if (!installation) {
      throw new NotFoundException(`Active installation for module ID ${moduleId} not found for tenant ${tenantId}`);
    }

    return installation;
  }

  async update(id: string, updateDto: UpdateModuleInstallationDto): Promise<ModuleInstallation> {
    const installation = await this.findOne(id);

    const updatedInstallation = await this.installationRepository.save({
      ...installation,
      ...updateDto,
    });

    // Emit event
    this.eventEmitter.emit('module.installation.updated', {
      installationId: id,
      tenantId: installation.tenantId,
      moduleId: installation.moduleId,
      updates: updateDto,
    });

    return updatedInstallation;
  }

  async disable(id: string, userId: string): Promise<ModuleInstallation> {
    const installation = await this.findOne(id);

    if (installation.status !== 'active') {
      throw new BadRequestException(`Installation is not active (current status: ${installation.status})`);
    }

    installation.status = 'disabled';
    installation.disabledAt = new Date();

    const updatedInstallation = await this.installationRepository.save(installation);

    // Emit event
    this.eventEmitter.emit('module.disabled', {
      installationId: id,
      tenantId: installation.tenantId,
      moduleId: installation.moduleId,
      moduleVersionId: installation.moduleVersionId,
      disabledBy: userId,
    });

    return updatedInstallation;
  }

  async enable(id: string, userId: string): Promise<ModuleInstallation> {
    const installation = await this.findOne(id);

    if (installation.status !== 'disabled') {
      throw new BadRequestException(`Installation is not disabled (current status: ${installation.status})`);
    }

    // Check compatibility before enabling
    await this.compatibilityCheckService.checkCompatibility(
      installation.tenantId,
      installation.moduleId,
      installation.moduleVersionId,
    );

    installation.status = 'active';
    installation.disabledAt = null;

    const updatedInstallation = await this.installationRepository.save(installation);

    // Emit event
    this.eventEmitter.emit('module.enabled', {
      installationId: id,
      tenantId: installation.tenantId,
      moduleId: installation.moduleId,
      moduleVersionId: installation.moduleVersionId,
      enabledBy: userId,
    });

    return updatedInstallation;
  }

  async uninstall(id: string, userId: string): Promise<ModuleInstallation> {
    const installation = await this.findOne(id);

    if (installation.status === 'uninstalled') {
      throw new BadRequestException('Module is already uninstalled');
    }

    installation.status = 'uninstalled';
    installation.uninstalledAt = new Date();

    const updatedInstallation = await this.installationRepository.save(installation);

    // Emit event
    this.eventEmitter.emit('module.uninstalled', {
      installationId: id,
      tenantId: installation.tenantId,
      moduleId: installation.moduleId,
      moduleVersionId: installation.moduleVersionId,
      uninstalledBy: userId,
    });

    return updatedInstallation;
  }

  async upgradeVersion(id: string, moduleVersionId: string, userId: string): Promise<ModuleInstallation> {
    const installation = await this.findOne(id);

    if (installation.status !== 'active') {
      throw new BadRequestException(`Cannot upgrade non-active installation (current status: ${installation.status})`);
    }

    // Get the current version
    const currentVersion = await this.moduleVersionsService.findOne(installation.moduleVersionId);

    // Get the new version
    const newVersion = await this.moduleVersionsService.findOne(moduleVersionId);

    // Verify that the new version belongs to the same module
    if (newVersion.moduleId !== installation.moduleId) {
      throw new BadRequestException('New version does not belong to the same module');
    }

    // Check compatibility before upgrading
    await this.compatibilityCheckService.checkCompatibility(
      installation.tenantId,
      installation.moduleId,
      moduleVersionId,
    );

    // Update the installation
    installation.moduleVersionId = moduleVersionId;

    const updatedInstallation = await this.installationRepository.save(installation);

    // Emit event
    this.eventEmitter.emit('module.upgraded', {
      installationId: id,
      tenantId: installation.tenantId,
      moduleId: installation.moduleId,
      fromVersionId: currentVersion.id,
      fromVersion: currentVersion.version,
      toVersionId: newVersion.id,
      toVersion: newVersion.version,
      upgradedBy: userId,
    });

    return updatedInstallation;
  }
}

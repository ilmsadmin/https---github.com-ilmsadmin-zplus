import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as semver from 'semver';
import { ModuleDependency } from '../module-dependencies/entities/module-dependency.entity';
import { ModuleVersion } from '../module-versions/entities/module-version.entity';
import { ModuleEntity } from '../modules/entities/module.entity';
import { ModuleInstallation } from '../module-installations/entities/module-installation.entity';

export interface CompatibilityResult {
  isCompatible: boolean;
  incompatibleDependencies?: {
    dependencyName: string;
    required: string;
    available: string | null;
    isOptional: boolean;
  }[];
  environmentCompatible: boolean;
  platformVersion: {
    required: string;
    actual: string;
    isCompatible: boolean;
  };
}

export interface UpgradePathItem {
  moduleId: string;
  moduleName: string;
  currentVersion: string;
  targetVersion: string;
  isCompatible: boolean;
  canSkipUpdate: boolean;
  dependencyUpdatesRequired: {
    moduleId: string;
    moduleName: string;
    requiredVersion: string;
    currentVersion: string | null;
  }[];
}

@Injectable()
export class CompatibilityCheckService {
  private readonly logger = new Logger(CompatibilityCheckService.name);
  private readonly PLATFORM_VERSION = process.env.PLATFORM_VERSION || '1.0.0';

  constructor(
    @InjectRepository(ModuleDependency)
    private readonly dependencyRepository: Repository<ModuleDependency>,
    @InjectRepository(ModuleVersion)
    private readonly versionRepository: Repository<ModuleVersion>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
    @InjectRepository(ModuleInstallation)
    private readonly installationRepository: Repository<ModuleInstallation>,
  ) {}

  async checkVersionCompatibility(
    moduleVersionId: string,
    tenantId: string,
  ): Promise<CompatibilityResult> {
    try {
      const version = await this.versionRepository.findOne({
        where: { id: moduleVersionId },
        relations: ['module'],
      });

      if (!version) {
        throw new Error(`Module version with ID ${moduleVersionId} not found`);
      }

      // Get all dependencies for this version
      const dependencies = await this.dependencyRepository.find({
        where: { dependentVersionId: moduleVersionId },
      });

      // Check platform version compatibility
      const platformCompatible = !version.platformRequirement || 
        semver.satisfies(this.PLATFORM_VERSION, version.platformRequirement);

      // Get installed modules for this tenant
      const installedModules = await this.installationRepository.find({
        where: { tenantId },
        relations: ['moduleVersion', 'moduleVersion.module'],
      });

      // Check each dependency
      const incompatibleDependencies = [];
      
      for (const dependency of dependencies) {
        const dependencyModule = await this.moduleRepository.findOne({
          where: { id: dependency.dependencyModuleId },
        });

        if (!dependencyModule) {
          continue;
        }

        const installedDependency = installedModules.find(
          installation => installation.moduleVersion.module.id === dependency.dependencyModuleId,
        );

        if (!installedDependency) {
          if (!dependency.isOptional) {
            incompatibleDependencies.push({
              dependencyName: dependencyModule.name,
              required: dependency.versionRequirement,
              available: null,
              isOptional: dependency.isOptional,
            });
          }
          continue;
        }

        // Check if installed version satisfies the version requirement
        if (!semver.satisfies(installedDependency.moduleVersion.version, dependency.versionRequirement)) {
          incompatibleDependencies.push({
            dependencyName: dependencyModule.name,
            required: dependency.versionRequirement,
            available: installedDependency.moduleVersion.version,
            isOptional: dependency.isOptional,
          });
        }
      }

      // Only required dependencies cause compatibility issues
      const requiredIncompatibles = incompatibleDependencies.filter(d => !d.isOptional);

      return {
        isCompatible: requiredIncompatibles.length === 0 && platformCompatible,
        incompatibleDependencies: incompatibleDependencies.length ? incompatibleDependencies : undefined,
        environmentCompatible: platformCompatible,
        platformVersion: {
          required: version.platformRequirement || '*',
          actual: this.PLATFORM_VERSION,
          isCompatible: platformCompatible,
        },
      };
    } catch (error) {
      this.logger.error(`Error checking compatibility: ${error.message}`, error.stack);
      throw new Error(`Failed to check compatibility: ${error.message}`);
    }
  }

  async calculateUpgradePath(
    moduleId: string,
    targetVersionId: string,
    tenantId: string,
  ): Promise<UpgradePathItem[]> {
    try {
      // Get current installation
      const currentInstallation = await this.installationRepository.findOne({
        where: { 
          moduleVersion: { module: { id: moduleId } },
          tenantId,
          isActive: true,
        },
        relations: ['moduleVersion', 'moduleVersion.module'],
      });

      if (!currentInstallation) {
        throw new Error(`Module ${moduleId} is not currently installed for tenant ${tenantId}`);
      }

      // Get target version
      const targetVersion = await this.versionRepository.findOne({
        where: { id: targetVersionId },
        relations: ['module'],
      });

      if (!targetVersion) {
        throw new Error(`Target version ${targetVersionId} not found`);
      }

      if (targetVersion.module.id !== moduleId) {
        throw new Error(`Target version ${targetVersionId} does not belong to module ${moduleId}`);
      }

      // Check if direct upgrade is possible
      const compatibility = await this.checkVersionCompatibility(targetVersionId, tenantId);
      
      const upgradePath: UpgradePathItem[] = [
        {
          moduleId,
          moduleName: targetVersion.module.name,
          currentVersion: currentInstallation.moduleVersion.version,
          targetVersion: targetVersion.version,
          isCompatible: compatibility.isCompatible,
          canSkipUpdate: targetVersion.canSkipFrom.includes(currentInstallation.moduleVersion.version),
          dependencyUpdatesRequired: (compatibility.incompatibleDependencies || [])
            .filter(d => !d.isOptional)
            .map(d => ({
              moduleId: moduleId, // This would need to be looked up in a real scenario
              moduleName: d.dependencyName,
              requiredVersion: d.required,
              currentVersion: d.available,
            })),
        }
      ];

      return upgradePath;
    } catch (error) {
      this.logger.error(`Error calculating upgrade path: ${error.message}`, error.stack);
      throw new Error(`Failed to calculate upgrade path: ${error.message}`);
    }
  }

  async checkModuleSetCompatibility(
    moduleVersionIds: string[],
    tenantId: string,
  ): Promise<{
    isCompatible: boolean;
    incompatibleModules: {
      moduleId: string;
      moduleName: string;
      issues: string[];
    }[];
  }> {
    try {
      const results = await Promise.all(
        moduleVersionIds.map(id => this.checkVersionCompatibility(id, tenantId))
      );

      const versionsInfo = await Promise.all(
        moduleVersionIds.map(id => 
          this.versionRepository.findOne({
            where: { id },
            relations: ['module'],
          })
        )
      );

      const incompatibleModules = results
        .map((result, index) => {
          if (result.isCompatible) return null;
          
          const versionInfo = versionsInfo[index];
          if (!versionInfo) return null;
          
          const issues = [];
          
          if (!result.environmentCompatible) {
            issues.push(`Incompatible with platform version ${result.platformVersion.actual} (requires ${result.platformVersion.required})`);
          }
          
          if (result.incompatibleDependencies?.length) {
            issues.push(
              ...result.incompatibleDependencies
                .filter(d => !d.isOptional)
                .map(d => 
                  d.available 
                    ? `Requires ${d.dependencyName} ${d.required}, but ${d.available} is installed`
                    : `Missing required dependency: ${d.dependencyName} ${d.required}`
                )
            );
          }
          
          return {
            moduleId: versionInfo.module.id,
            moduleName: versionInfo.module.name,
            issues,
          };
        })
        .filter(Boolean);

      return {
        isCompatible: incompatibleModules.length === 0,
        incompatibleModules,
      };
    } catch (error) {
      this.logger.error(`Error checking module set compatibility: ${error.message}`, error.stack);
      throw new Error(`Failed to check module set compatibility: ${error.message}`);
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as NodeClam from 'clamscan';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class VirusScanService implements OnModuleInit {
  private readonly logger = new Logger(VirusScanService.name);
  private clamscan: NodeClam;
  private isInitialized = false;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('file.enableVirusScan', false);
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Virus scanning is disabled');
      return;
    }

    try {
      this.clamscan = await new NodeClam().init({
        clamdscan: {
          socket: '/var/run/clamav/clamd.sock',
          host: 'localhost',
          port: 3310,
          localFallback: true,
          path: '/usr/bin/clamdscan',
          configFile: '/etc/clamav/clamd.conf',
        },
        preference: 'clamdscan',
      });
      
      this.isInitialized = true;
      this.logger.log('ClamAV antivirus scanner initialized successfully');
      
      // Verify ClamAV is working
      const version = await this.clamscan.getVersion();
      this.logger.log(`ClamAV version: ${version}`);
    } catch (error) {
      this.logger.error(`Failed to initialize ClamAV: ${error.message}`);
      // Don't throw error to allow service to start without virus scanning
    }
  }

  /**
   * Scan file for viruses
   */
  async scanFile(filePath: string): Promise<{ isVirus: boolean; virusName?: string }> {
    if (!this.enabled) {
      return { isVirus: false };
    }

    if (!this.isInitialized) {
      this.logger.warn('Virus scanner not initialized, skipping scan');
      return { isVirus: false };
    }

    try {
      // Ensure file exists
      await fs.access(filePath);
      
      // Scan the file
      const { isVirus, viruses } = await this.clamscan.scanFile(filePath);
      
      if (isVirus) {
        this.logger.warn(`Virus detected in file ${path.basename(filePath)}: ${viruses.join(', ')}`);
        return { isVirus, virusName: viruses.join(', ') };
      }
      
      return { isVirus: false };
    } catch (error) {
      this.logger.error(`Error scanning file for viruses: ${error.message}`);
      
      // Mock implementation for development if ClamAV is not available
      if (process.env.NODE_ENV === 'development' && error.message.includes('spawn clamdscan ENOENT')) {
        this.logger.warn('ClamAV not found in development environment, using mock implementation');
        return { isVirus: false };
      }
      
      throw error;
    }
  }

  /**
   * Check if virus scanning is available
   */
  isAvailable(): boolean {
    return this.enabled && this.isInitialized;
  }
}

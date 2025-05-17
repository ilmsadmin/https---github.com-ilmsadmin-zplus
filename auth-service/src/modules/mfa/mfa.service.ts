import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SystemUser } from '../users/entities/system-user.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { MfaSetupDto, MfaVerifyDto, MfaDisableDto, MfaRecoveryCodeDto, MfaMethodEnum } from './dto/mfa.dto';
import { JwtPayload } from '../../common/interfaces/auth.interface';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MfaService {
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private authService: AuthService,
    @InjectRepository(SystemUser, 'system')
    private systemUsersRepository: Repository<SystemUser>,
    @InjectRepository(Tenant, 'system')
    private tenantsRepository: Repository<Tenant>,
    @InjectDataSource('system')
    private systemDataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Setup MFA for a user
  async setupMfa(user: JwtPayload, setupDto: MfaSetupDto): Promise<any> {
    try {
      if (user.tenant_id) {
        // Tenant user MFA setup
        return await this.setupTenantUserMfa(user, setupDto);
      } else {
        // System user MFA setup
        return await this.setupSystemUserMfa(user, setupDto);
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to setup MFA: ${error.message}`);
    }
  }

  // Setup MFA for a system user
  private async setupSystemUserMfa(user: JwtPayload, setupDto: MfaSetupDto): Promise<any> {
    // System users can only use TOTP
    if (setupDto.method !== MfaMethodEnum.TOTP) {
      throw new BadRequestException('System users can only use TOTP for MFA');
    }
    
    const systemUser = await this.systemUsersRepository.findOne({
      where: { id: user.sub },
    });
    
    if (!systemUser) {
      throw new NotFoundException('User not found');
    }
    
    if (systemUser.is_mfa_enabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }
    
    // Generate new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Multi-Tenant-System:${systemUser.email}`,
    });
    
    // Create QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    // Store the secret temporarily in cache until verified
    await this.cacheManager.set(
      `mfa_setup:${user.sub}:system_user`,
      JSON.stringify({
        secret: secret.base32,
        method: MfaMethodEnum.TOTP,
      }),
      600 // 10 minutes
    );
    
    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();
    
    await this.cacheManager.set(
      `mfa_recovery:${user.sub}:system_user`,
      JSON.stringify(recoveryCodes),
      600 // 10 minutes
    );
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      recoveryCodes: recoveryCodes,
    };
  }

  // Setup MFA for a tenant user
  private async setupTenantUserMfa(user: JwtPayload, setupDto: MfaSetupDto): Promise<any> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: user.tenant_id, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    // Check if MFA is enabled at tenant level
    if (!tenant.auth_settings?.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled for this tenant');
    }

    const schemaName = `tenant_${user.schema_name}`;
    
    // Get the user
    const users = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.users WHERE id = $1 AND status = 'active'`,
      [user.sub]
    );
    
    if (!users || users.length === 0) {
      throw new NotFoundException('User not found or inactive');
    }
    
    const tenantUser = users[0];
    
    if (tenantUser.is_mfa_enabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }
    
    // Handle different MFA methods
    switch (setupDto.method) {
      case MfaMethodEnum.TOTP:
        // Generate new TOTP secret
        const secret = speakeasy.generateSecret({
          name: `${tenant.name}:${tenantUser.email}`,
        });
        
        // Create QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        
        // Store the secret temporarily in cache until verified
        await this.cacheManager.set(
          `mfa_setup:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify({
            secret: secret.base32,
            method: MfaMethodEnum.TOTP,
          }),
          600 // 10 minutes
        );
        
        // Generate recovery codes
        const recoveryCodes = this.generateRecoveryCodes();
        
        await this.cacheManager.set(
          `mfa_recovery:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify(recoveryCodes),
          600 // 10 minutes
        );
        
        return {
          secret: secret.base32,
          qrCode: qrCodeUrl,
          recoveryCodes: recoveryCodes,
        };
        
      case MfaMethodEnum.SMS:
        // Verify phone number is provided
        if (!setupDto.phoneNumber) {
          throw new BadRequestException('Phone number is required for SMS MFA');
        }
        
        // Validate phone number format (simple validation)
        if (!/^\+[1-9]\d{1,14}$/.test(setupDto.phoneNumber)) {
          throw new BadRequestException('Invalid phone number format. Use international format with + (e.g., +1234567890)');
        }
        
        // Store the phone number temporarily in cache until verified
        await this.cacheManager.set(
          `mfa_setup:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify({
            phoneNumber: setupDto.phoneNumber,
            method: MfaMethodEnum.SMS,
          }),
          600 // 10 minutes
        );
        
        // Generate a verification code and send it (mock implementation)
        const smsCode = this.generateRandomDigits(6);
        
        // In a real implementation, we would send this via SMS
        console.log(`SMS verification code for ${tenantUser.email}: ${smsCode}`);
        
        // Store the verification code in cache
        await this.cacheManager.set(
          `mfa_verify:${user.sub}:tenant_user:${user.tenant_id}`,
          smsCode,
          300 // 5 minutes
        );
        
        // Generate recovery codes
        const smsRecoveryCodes = this.generateRecoveryCodes();
        
        await this.cacheManager.set(
          `mfa_recovery:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify(smsRecoveryCodes),
          600 // 10 minutes
        );
        
        return {
          phoneNumber: setupDto.phoneNumber,
          message: 'Verification code sent to your phone',
          recoveryCodes: smsRecoveryCodes,
        };
        
      case MfaMethodEnum.EMAIL:
        // Generate a verification code and send it (mock implementation)
        const emailCode = this.generateRandomDigits(6);
        
        // In a real implementation, we would send this via email
        console.log(`Email verification code for ${tenantUser.email}: ${emailCode}`);
        
        // Store the verification code in cache
        await this.cacheManager.set(
          `mfa_verify:${user.sub}:tenant_user:${user.tenant_id}`,
          emailCode,
          300 // 5 minutes
        );
        
        // Store the email method temporarily in cache until verified
        await this.cacheManager.set(
          `mfa_setup:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify({
            email: tenantUser.email,
            method: MfaMethodEnum.EMAIL,
          }),
          600 // 10 minutes
        );
        
        // Generate recovery codes
        const emailRecoveryCodes = this.generateRecoveryCodes();
        
        await this.cacheManager.set(
          `mfa_recovery:${user.sub}:tenant_user:${user.tenant_id}`,
          JSON.stringify(emailRecoveryCodes),
          600 // 10 minutes
        );
        
        return {
          email: tenantUser.email,
          message: 'Verification code sent to your email',
          recoveryCodes: emailRecoveryCodes,
        };
        
      default:
        throw new BadRequestException('Unsupported MFA method');
    }
  }

  // Verify MFA setup
  async verifyMfaSetup(user: JwtPayload, verifyDto: MfaVerifyDto): Promise<any> {
    try {
      if (user.tenant_id) {
        // Tenant user MFA verification
        return await this.verifyTenantUserMfaSetup(user, verifyDto);
      } else {
        // System user MFA verification
        return await this.verifySystemUserMfaSetup(user, verifyDto);
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to verify MFA setup: ${error.message}`);
    }
  }

  // Verify MFA setup for system user
  private async verifySystemUserMfaSetup(user: JwtPayload, verifyDto: MfaVerifyDto): Promise<any> {
    // Get the temporary secret from cache
    const cachedDataStr = await this.cacheManager.get(`mfa_setup:${user.sub}:system_user`);
    
    if (!cachedDataStr) {
      throw new BadRequestException('MFA setup session expired or not found. Please restart the setup process.');
    }
    
    const cachedData = JSON.parse(cachedDataStr as string);
    
    if (cachedData.method !== MfaMethodEnum.TOTP) {
      throw new BadRequestException('Invalid MFA method for system user');
    }
    
    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: cachedData.secret,
      encoding: 'base32',
      token: verifyDto.code,
      window: 1, // Allow 1 time step before and after for clock drift
    });
    
    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }
    
    // Get the recovery codes
    const recoveryCodesStr = await this.cacheManager.get(`mfa_recovery:${user.sub}:system_user`);
    const recoveryCodes = recoveryCodesStr ? JSON.parse(recoveryCodesStr as string) : [];
    
    // Update the user in database
    await this.systemUsersRepository.update(user.sub, {
      is_mfa_enabled: true,
      mfa_secret: cachedData.secret,
    });
    
    // Clean up cache
    await this.cacheManager.del(`mfa_setup:${user.sub}:system_user`);
    await this.cacheManager.del(`mfa_recovery:${user.sub}:system_user`);
    
    // Emit MFA enabled event
    this.eventEmitter.emit('auth.mfa.enabled', {
      userId: user.sub,
      userType: 'system_user',
      method: MfaMethodEnum.TOTP,
    });
    
    return {
      message: 'MFA has been successfully enabled',
      recoveryCodes: recoveryCodes,
    };
  }

  // Verify MFA setup for tenant user
  private async verifyTenantUserMfaSetup(user: JwtPayload, verifyDto: MfaVerifyDto): Promise<any> {
    // Get the temporary data from cache
    const cachedDataStr = await this.cacheManager.get(`mfa_setup:${user.sub}:tenant_user:${user.tenant_id}`);
    
    if (!cachedDataStr) {
      throw new BadRequestException('MFA setup session expired or not found. Please restart the setup process.');
    }
    
    const cachedData = JSON.parse(cachedDataStr as string);
    
    // Get tenant
    const tenant = await this.tenantsRepository.findOne({
      where: { id: user.tenant_id, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }
    
    const schemaName = `tenant_${user.schema_name}`;
    let verified = false;
    
    // Verify based on the MFA method
    switch (cachedData.method) {
      case MfaMethodEnum.TOTP:
        verified = speakeasy.totp.verify({
          secret: cachedData.secret,
          encoding: 'base32',
          token: verifyDto.code,
          window: 1, // Allow 1 time step before and after for clock drift
        });
        break;
        
      case MfaMethodEnum.SMS:
      case MfaMethodEnum.EMAIL:
        // Get the verification code from cache
        const storedCode = await this.cacheManager.get(`mfa_verify:${user.sub}:tenant_user:${user.tenant_id}`);
        verified = storedCode === verifyDto.code;
        break;
        
      default:
        throw new BadRequestException('Unsupported MFA method');
    }
    
    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }
    
    // Get the recovery codes
    const recoveryCodesStr = await this.cacheManager.get(`mfa_recovery:${user.sub}:tenant_user:${user.tenant_id}`);
    const recoveryCodes = recoveryCodesStr ? JSON.parse(recoveryCodesStr as string) : [];
    
    // Update the user in database
    if (cachedData.method === MfaMethodEnum.TOTP) {
      await this.systemDataSource.query(
        `UPDATE ${schemaName}.users SET 
          is_mfa_enabled = true,
          mfa_secret = $1,
          mfa_method = $2
        WHERE id = $3`,
        [cachedData.secret, cachedData.method, user.sub]
      );
    } else if (cachedData.method === MfaMethodEnum.SMS) {
      await this.systemDataSource.query(
        `UPDATE ${schemaName}.users SET 
          is_mfa_enabled = true,
          phone_number = $1,
          mfa_method = $2
        WHERE id = $3`,
        [cachedData.phoneNumber, cachedData.method, user.sub]
      );
    } else if (cachedData.method === MfaMethodEnum.EMAIL) {
      await this.systemDataSource.query(
        `UPDATE ${schemaName}.users SET 
          is_mfa_enabled = true,
          mfa_method = $1
        WHERE id = $2`,
        [cachedData.method, user.sub]
      );
    }
    
    // Store recovery codes in a new table
    for (const code of recoveryCodes) {
      await this.systemDataSource.query(
        `INSERT INTO ${schemaName}.mfa_recovery_codes (user_id, code, is_used)
        VALUES ($1, $2, false)`,
        [user.sub, code]
      );
    }
    
    // Clean up cache
    await this.cacheManager.del(`mfa_setup:${user.sub}:tenant_user:${user.tenant_id}`);
    await this.cacheManager.del(`mfa_verify:${user.sub}:tenant_user:${user.tenant_id}`);
    await this.cacheManager.del(`mfa_recovery:${user.sub}:tenant_user:${user.tenant_id}`);
    
    // Emit MFA enabled event
    this.eventEmitter.emit('auth.mfa.enabled', {
      userId: user.sub,
      tenantId: user.tenant_id,
      method: cachedData.method,
    });
    
    return {
      message: 'MFA has been successfully enabled',
      recoveryCodes: recoveryCodes,
    };
  }

  // Verify MFA during login
  async verifyMfaLogin(verifyDto: MfaVerifyDto): Promise<any> {
    try {
      // Get session data from cache
      const sessionData = await this.cacheManager.get(`mfa_session:${verifyDto.sessionId}`);
      
      if (!sessionData) {
        throw new UnauthorizedException('MFA session expired or invalid');
      }
      
      const session = JSON.parse(sessionData as string);
      
      if (session.userType === 'system_user') {
        // System user MFA verification
        return await this.verifySystemUserMfaLogin(session, verifyDto);
      } else {
        // Tenant user MFA verification
        return await this.verifyTenantUserMfaLogin(session, verifyDto);
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to verify MFA login: ${error.message}`);
    }
  }

  // Verify MFA login for system user
  private async verifySystemUserMfaLogin(session: any, verifyDto: MfaVerifyDto): Promise<any> {
    const user = await this.systemUsersRepository.findOne({
      where: { id: session.userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.is_mfa_enabled || !user.mfa_secret) {
      throw new BadRequestException('MFA is not enabled for this user');
    }
    
    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: verifyDto.code,
      window: 1, // Allow 1 time step before and after for clock drift
    });
    
    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }
    
    // Update last login time
    await this.systemUsersRepository.update(user.id, {
      last_login_at: new Date(),
    });
    
    // Generate tokens
    const tokens = await this.authService.generateTokens(user, 'system_user');
    
    // Clean up session
    await this.cacheManager.del(`mfa_session:${verifyDto.sessionId}`);
    
    // Emit login event
    this.eventEmitter.emit('auth.login.success', {
      userId: user.id,
      userType: 'system_user',
    });
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isMfaEnabled: user.is_mfa_enabled,
      },
    };
  }

  // Verify MFA login for tenant user
  private async verifyTenantUserMfaLogin(session: any, verifyDto: MfaVerifyDto): Promise<any> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: session.tenantId, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const schemaName = `tenant_${session.tenantSchemaName}`;
    
    // Get the user
    const users = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.users WHERE id = $1 AND status = 'active'`,
      [session.userId]
    );
    
    if (!users || users.length === 0) {
      throw new NotFoundException('User not found or inactive');
    }
    
    const user = users[0];
    
    if (!user.is_mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }
    
    let verified = false;
    
    // Verify based on the MFA method
    switch (user.mfa_method) {
      case MfaMethodEnum.TOTP:
        if (!user.mfa_secret) {
          throw new BadRequestException('TOTP is not properly configured');
        }
        
        verified = speakeasy.totp.verify({
          secret: user.mfa_secret,
          encoding: 'base32',
          token: verifyDto.code,
          window: 1, // Allow 1 time step before and after for clock drift
        });
        break;
        
      case MfaMethodEnum.SMS:
        // In a real implementation, we would verify against a code sent via SMS
        // For now, we'll use a code from cache as a simulation
        const smsCode = await this.cacheManager.get(`mfa_login_code:${session.userId}:sms`);
        verified = smsCode === verifyDto.code;
        break;
        
      case MfaMethodEnum.EMAIL:
        // In a real implementation, we would verify against a code sent via email
        // For now, we'll use a code from cache as a simulation
        const emailCode = await this.cacheManager.get(`mfa_login_code:${session.userId}:email`);
        verified = emailCode === verifyDto.code;
        break;
        
      default:
        throw new BadRequestException('Unsupported MFA method');
    }
    
    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }
    
    // Get user's role and permissions
    const roleResult = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.roles WHERE id = $1`,
      [user.role_id]
    );
    
    const role = roleResult[0];
    
    // Update last login time
    await this.systemDataSource.query(
      `UPDATE ${schemaName}.users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );
    
    // Log the successful MFA verification
    await this.systemDataSource.query(
      `INSERT INTO ${schemaName}.user_logs 
      (user_id, action, ip_address, user_agent) 
      VALUES ($1, 'mfa_verification', $2, $3)`,
      [user.id, 'request.ip', 'request.userAgent']
    );
    
    // Prepare user object for token generation
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: tenant.id,
      tenantSchemaName: tenant.schema_name,
      role: role?.name || 'user',
      permissions: role?.permissions || [],
    };
    
    // Generate tokens
    const tokens = await this.authService.generateTokens(userForToken, 'tenant_user');
    
    // Clean up session
    await this.cacheManager.del(`mfa_session:${verifyDto.sessionId}`);
    
    // Clean up verification codes if they exist
    await this.cacheManager.del(`mfa_login_code:${session.userId}:sms`);
    await this.cacheManager.del(`mfa_login_code:${session.userId}:email`);
    
    // Emit login event
    this.eventEmitter.emit('auth.login.success', {
      userId: user.id,
      tenantId: tenant.id,
    });
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: userForToken.role,
        permissions: userForToken.permissions,
        isMfaEnabled: user.is_mfa_enabled,
        tenantId: tenant.id,
        tenantSchemaName: tenant.schema_name,
      },
    };
  }

  // Disable MFA for a user
  async disableMfa(user: JwtPayload, disableDto: MfaDisableDto): Promise<any> {
    try {
      if (user.tenant_id) {
        // Tenant user MFA disable
        return await this.disableTenantUserMfa(user, disableDto);
      } else {
        // System user MFA disable
        return await this.disableSystemUserMfa(user, disableDto);
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to disable MFA: ${error.message}`);
    }
  }

  // Disable MFA for system user
  private async disableSystemUserMfa(user: JwtPayload, disableDto: MfaDisableDto): Promise<any> {
    const systemUser = await this.systemUsersRepository.findOne({
      where: { id: user.sub },
    });
    
    if (!systemUser) {
      throw new NotFoundException('User not found');
    }
    
    if (!systemUser.is_mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(disableDto.currentPassword, systemUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Disable MFA
    await this.systemUsersRepository.update(user.sub, {
      is_mfa_enabled: false,
      mfa_secret: null,
    });
    
    // Emit MFA disabled event
    this.eventEmitter.emit('auth.mfa.disabled', {
      userId: user.sub,
      userType: 'system_user',
    });
    
    return {
      message: 'MFA has been successfully disabled',
    };
  }

  // Disable MFA for tenant user
  private async disableTenantUserMfa(user: JwtPayload, disableDto: MfaDisableDto): Promise<any> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: user.tenant_id, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const schemaName = `tenant_${user.schema_name}`;
    
    // Get the user
    const users = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.users WHERE id = $1 AND status = 'active'`,
      [user.sub]
    );
    
    if (!users || users.length === 0) {
      throw new NotFoundException('User not found or inactive');
    }
    
    const tenantUser = users[0];
    
    if (!tenantUser.is_mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }
    
    // If MFA is required at tenant level, check if user can disable it
    if (tenant.auth_settings?.mfaRequired) {
      // Check if user has admin role that allows MFA override
      if (!user.permissions?.includes('admin:override_mfa')) {
        throw new ForbiddenException('MFA is required by your organization and cannot be disabled');
      }
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(disableDto.currentPassword, tenantUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Disable MFA
    await this.systemDataSource.query(
      `UPDATE ${schemaName}.users SET 
        is_mfa_enabled = false,
        mfa_secret = NULL
      WHERE id = $1`,
      [user.sub]
    );
    
    // Delete recovery codes
    await this.systemDataSource.query(
      `DELETE FROM ${schemaName}.mfa_recovery_codes WHERE user_id = $1`,
      [user.sub]
    );
    
    // Log the MFA disable
    await this.systemDataSource.query(
      `INSERT INTO ${schemaName}.user_logs 
      (user_id, action, ip_address, user_agent) 
      VALUES ($1, 'mfa_disabled', $2, $3)`,
      [user.sub, 'request.ip', 'request.userAgent']
    );
    
    // Emit MFA disabled event
    this.eventEmitter.emit('auth.mfa.disabled', {
      userId: user.sub,
      tenantId: user.tenant_id,
    });
    
    return {
      message: 'MFA has been successfully disabled',
    };
  }

  // Use recovery code for MFA
  async useRecoveryCode(recoveryDto: MfaRecoveryCodeDto): Promise<any> {
    try {
      // Get session data from cache
      const sessionData = await this.cacheManager.get(`mfa_session:${recoveryDto.sessionId}`);
      
      if (!sessionData) {
        throw new UnauthorizedException('MFA session expired or invalid');
      }
      
      const session = JSON.parse(sessionData as string);
      
      if (session.userType === 'system_user') {
        // Not implemented for system users yet
        throw new BadRequestException('Recovery codes not supported for system users');
      } else {
        // Tenant user recovery code
        return await this.useTenantUserRecoveryCode(session, recoveryDto);
      }
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to verify recovery code: ${error.message}`);
    }
  }

  // Use recovery code for tenant user
  private async useTenantUserRecoveryCode(session: any, recoveryDto: MfaRecoveryCodeDto): Promise<any> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: session.tenantId, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const schemaName = `tenant_${session.tenantSchemaName}`;
    
    // Get the user
    const users = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.users WHERE id = $1 AND status = 'active'`,
      [session.userId]
    );
    
    if (!users || users.length === 0) {
      throw new NotFoundException('User not found or inactive');
    }
    
    const user = users[0];
    
    if (!user.is_mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }
    
    // Verify the recovery code
    const recoveryCodeResult = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.mfa_recovery_codes 
      WHERE user_id = $1 AND code = $2 AND is_used = false`,
      [user.id, recoveryDto.recoveryCode]
    );
    
    if (!recoveryCodeResult || recoveryCodeResult.length === 0) {
      throw new UnauthorizedException('Invalid or already used recovery code');
    }
    
    // Mark the code as used
    await this.systemDataSource.query(
      `UPDATE ${schemaName}.mfa_recovery_codes 
      SET is_used = true, used_at = NOW()
      WHERE id = $1`,
      [recoveryCodeResult[0].id]
    );
    
    // Get user's role and permissions
    const roleResult = await this.systemDataSource.query(
      `SELECT * FROM ${schemaName}.roles WHERE id = $1`,
      [user.role_id]
    );
    
    const role = roleResult[0];
    
    // Update last login time
    await this.systemDataSource.query(
      `UPDATE ${schemaName}.users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );
    
    // Log the recovery code usage
    await this.systemDataSource.query(
      `INSERT INTO ${schemaName}.user_logs 
      (user_id, action, ip_address, user_agent) 
      VALUES ($1, 'mfa_recovery_used', $2, $3)`,
      [user.id, 'request.ip', 'request.userAgent']
    );
    
    // Prepare user object for token generation
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: tenant.id,
      tenantSchemaName: tenant.schema_name,
      role: role?.name || 'user',
      permissions: role?.permissions || [],
    };
    
    // Generate tokens
    const tokens = await this.authService.generateTokens(userForToken, 'tenant_user');
    
    // Clean up session
    await this.cacheManager.del(`mfa_session:${recoveryDto.sessionId}`);
    
    // Emit recovery code used event
    this.eventEmitter.emit('auth.mfa.recovery.used', {
      userId: user.id,
      tenantId: tenant.id,
    });
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: userForToken.role,
        permissions: userForToken.permissions,
        isMfaEnabled: user.is_mfa_enabled,
        tenantId: tenant.id,
        tenantSchemaName: tenant.schema_name,
      },
      message: 'Recovery code accepted. Please consider generating new recovery codes.',
    };
  }

  // Helper methods
  private generateRandomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  private generateRecoveryCodes(count = 10, length = 8): string[] {
    const codes = [];
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting characters that look similar

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Format code with hyphen for readability (e.g., ABCD-1234)
      code = code.slice(0, 4) + '-' + code.slice(4);
      codes.push(code);
    }

    return codes;
  }
}

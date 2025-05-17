import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SystemUser } from '../users/entities/system-user.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { JwtPayload, TokenResponse, PasswordPolicy } from '../../common/interfaces/auth.interface';
import { LoginDto, SystemLoginDto, RegisterUserDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth-request.dto';
import { LoginResponseDto, TokenRefreshResponseDto, MfaRequiredResponseDto, MessageResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(SystemUser, 'system')
    private systemUsersRepository: Repository<SystemUser>,
    @InjectRepository(Tenant, 'system')
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(RefreshToken, 'system')
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(RevokedToken, 'system')
    private revokedTokenRepository: Repository<RevokedToken>,
    @InjectDataSource('system')
    private systemDataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // System User Authentication
  async validateSystemUser(email: string, password: string): Promise<any> {
    const user = await this.systemUsersRepository.findOne({ 
      where: { email } 
    });

    if (!user) {
      return null;
    }

    // Check for too many failed login attempts
    if (user.failed_login_attempts >= 5) {
      // Update failed login attempts
      await this.systemUsersRepository.update(user.id, {
        failed_login_attempts: user.failed_login_attempts + 1,
      });
      
      throw new ForbiddenException('Account temporarily locked due to too many failed login attempts');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      // Update failed login attempts
      await this.systemUsersRepository.update(user.id, {
        failed_login_attempts: user.failed_login_attempts + 1,
      });
      
      return null;
    }

    // Reset failed login attempts and update last login
    await this.systemUsersRepository.update(user.id, {
      failed_login_attempts: 0,
      last_login_at: new Date(),
    });

    // Don't include password in the returned user object
    const { password: _, ...result } = user;
    return result;
  }

  // Tenant User Authentication
  async validateTenantUser(email: string, password: string, tenantSchema: string): Promise<any> {
    // First, verify the tenant exists and is active
    const tenant = await this.tenantsRepository.findOne({
      where: { schema_name: tenantSchema, status: 'active' },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant or tenant is not active');
    }

    // Create a connection to the tenant schema
    const schemaName = `tenant_${tenantSchema}`;
    
    try {
      // Query tenant user
      const result = await this.systemDataSource.query(
        `SELECT * FROM ${schemaName}.users WHERE email = $1`,
        [email]
      );

      const user = result[0];
      
      if (!user) {
        return null;
      }

      // Check if the user is locked
      if (user.is_locked && user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new ForbiddenException(`Account locked until ${user.locked_until}`);
      }

      // Check for too many failed login attempts
      const maxAttempts = tenant.auth_settings?.loginAttempts || 5;
      if (user.failed_login_attempts >= maxAttempts) {
        // Lock the account
        const lockoutDuration = tenant.auth_settings?.lockoutDuration || 30; // minutes
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + lockoutDuration);

        await this.systemDataSource.query(
          `UPDATE ${schemaName}.users SET 
            failed_login_attempts = failed_login_attempts + 1,
            is_locked = true,
            locked_until = $1
          WHERE id = $2`,
          [lockedUntil, user.id]
        );
        
        throw new ForbiddenException(`Account temporarily locked due to too many failed login attempts. Try again after ${lockoutDuration} minutes.`);
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        // Update failed login attempts
        await this.systemDataSource.query(
          `UPDATE ${schemaName}.users SET 
            failed_login_attempts = failed_login_attempts + 1
          WHERE id = $1`,
          [user.id]
        );
        
        return null;
      }

      // Get user's role and permissions
      const roleResult = await this.systemDataSource.query(
        `SELECT * FROM ${schemaName}.roles WHERE id = $1`,
        [user.role_id]
      );
      
      const role = roleResult[0];
      
      // Reset failed login attempts and update last login
      await this.systemDataSource.query(
        `UPDATE ${schemaName}.users SET 
          failed_login_attempts = 0,
          is_locked = false,
          locked_until = null,
          last_login_at = NOW()
        WHERE id = $1`,
        [user.id]
      );

      // Log the login event
      await this.systemDataSource.query(
        `INSERT INTO ${schemaName}.user_logs 
        (user_id, action, ip_address, user_agent) 
        VALUES ($1, 'login', $2, $3)`,
        [user.id, 'request.ip', 'request.userAgent']
      );

      // Don't include password in the returned user object
      const { password: _, ...userResult } = user;
      
      return {
        ...userResult,
        tenantId: tenant.id,
        tenantSchemaName: tenant.schema_name,
        role: role?.name || 'user',
        permissions: role?.permissions || [],
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to authenticate user: ${error.message}`);
    }
  }

  // Login system user or tenant user
  async login(loginDto: LoginDto, req: any): Promise<LoginResponseDto | MfaRequiredResponseDto> {
    let user;
    
    if (loginDto.tenant) {
      // Tenant user login
      user = await this.validateTenantUser(loginDto.email, loginDto.password, loginDto.tenant);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if MFA is required for this tenant user
      if (user.is_mfa_enabled) {
        // Create an MFA session
        const sessionId = uuidv4();
        
        // Store MFA session in Redis cache with short expiry (10 minutes)
        await this.cacheManager.set(
          `mfa_session:${sessionId}`,
          JSON.stringify({
            userId: user.id,
            tenantId: user.tenantId,
            tenantSchemaName: user.tenantSchemaName,
            email: user.email,
          }),
          600 // 10 minutes
        );
        
        return {
          requireMfa: true,
          mfaSessionId: sessionId,
          mfaMethods: [user.mfa_method] // From the user record
        };
      }

      // Proceed with normal login
      const tokens = await this.generateTokens(user, 'tenant_user');
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getJwtExpiresInSeconds('access'),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          permissions: user.permissions,
          isMfaEnabled: user.is_mfa_enabled,
          tenantId: user.tenantId,
          tenantSchemaName: user.tenantSchemaName,
        },
      };
    } else {
      // System user login
      user = await this.validateSystemUser(loginDto.email, loginDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if MFA is required for this system user
      if (user.is_mfa_enabled) {
        // Create an MFA session
        const sessionId = uuidv4();
        
        // Store MFA session in Redis cache with short expiry (10 minutes)
        await this.cacheManager.set(
          `mfa_session:${sessionId}`,
          JSON.stringify({
            userId: user.id,
            email: user.email,
            userType: 'system_user',
          }),
          600 // 10 minutes
        );
        
        return {
          requireMfa: true,
          mfaSessionId: sessionId,
          mfaMethods: ['totp'] // System users typically use TOTP
        };
      }

      // Proceed with normal login
      const tokens = await this.generateTokens(user, 'system_user');
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getJwtExpiresInSeconds('access'),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isMfaEnabled: user.is_mfa_enabled,
        },
      };
    }
  }

  // Login system admin user
  async systemLogin(loginDto: SystemLoginDto, req: any): Promise<LoginResponseDto | MfaRequiredResponseDto> {
    const user = await this.validateSystemUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is required for this system user
    if (user.is_mfa_enabled) {
      // Create an MFA session
      const sessionId = uuidv4();
      
      // Store MFA session in Redis cache with short expiry (10 minutes)
      await this.cacheManager.set(
        `mfa_session:${sessionId}`,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          userType: 'system_user',
        }),
        600 // 10 minutes
      );
      
      return {
        requireMfa: true,
        mfaSessionId: sessionId,
        mfaMethods: ['totp'] // System users typically use TOTP
      };
    }

    // Proceed with normal login
    const tokens = await this.generateTokens(user, 'system_user');
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getJwtExpiresInSeconds('access'),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isMfaEnabled: user.is_mfa_enabled,
      },
    };
  }
  /**
   * Handle OAuth login from various providers (Google, Facebook, etc.)
   * This method is called after the OAuth provider strategy validates the user
   */
  async oauthLogin(req: any): Promise<LoginResponseDto | MfaRequiredResponseDto> {
    // OAuth user data available in req.user after strategy validation
    const oauthUser = req.user;
    
    if (!oauthUser) {
      throw new UnauthorizedException('OAuth authentication failed');
    }
    
    // Check if user exists in our system, if not create them
    let systemUser = await this.systemUsersRepository.findOne({
      where: { email: oauthUser.email }
    });
    
    // If no existing user, create a new user with OAuth information
    if (!systemUser) {
      const hashedPassword = await bcrypt.hash(uuidv4(), 10); // Generate a random password
      
      systemUser = new SystemUser();
      systemUser.email = oauthUser.email;
      systemUser.username = oauthUser.email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      systemUser.password = hashedPassword;
      systemUser.role = 'user';
      systemUser.is_mfa_enabled = false;
      systemUser.created_at = new Date();
      systemUser.updated_at = new Date();
      
      await this.systemUsersRepository.save(systemUser);
    }
    
    // Update last login time
    systemUser.last_login_at = new Date();
    await this.systemUsersRepository.save(systemUser);
    
    // Check if MFA is required
    if (systemUser.is_mfa_enabled) {
      // Generate a MFA session ID
      const mfaSessionId = uuidv4();
      
      // Store MFA session in cache
      await this.cacheManager.set(
        `mfa_session:${mfaSessionId}`, 
        { userId: systemUser.id, userType: 'system_user' },
        60 * 5 * 1000 // 5 minutes
      );
      
      return {
        requireMfa: true,
        mfaSessionId,
        mfaMethods: ['totp'], // Assuming TOTP is the default method
      };
    }
    
    // Build user with standard format expected by generateTokens
    const user = {
      id: systemUser.id,
      username: systemUser.username,
      email: systemUser.email,
      role: systemUser.role,
    };
    
    // Generate tokens
    const tokens = await this.generateTokens(user, 'system_user');
    
    // Return token response
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      requireMfa: false,
      user: {
        id: systemUser.id,
        username: systemUser.username,
        email: systemUser.email,
        role: systemUser.role,
        isMfaEnabled: systemUser.is_mfa_enabled,
        permissions: []
      }
    };
  }

  // Generate JWT and refresh tokens
  async generateTokens(user: any, userType: 'system_user' | 'tenant_user'): Promise<TokenResponse> {
    try {
      // Create JWT payload
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        jti: uuidv4(), // Add a unique ID to the token
      };

      // Add tenant context for tenant users
      if (userType === 'tenant_user') {
        payload.tenant_id = user.tenantId;
        payload.schema_name = user.tenantSchemaName;
      }

      // Generate access token
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiration'),
      });

      // Generate refresh token
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiration'),
      });

      // Calculate token expiration
      const refreshTokenJwtPayload = this.jwtService.decode(refreshToken) as JwtPayload;
      const expiresAt = new Date();
      expiresAt.setTime(refreshTokenJwtPayload.exp * 1000);

      // Store refresh token in database
      await this.refreshTokenRepository.save({
        user_id: user.id,
        token: refreshToken,
        user_type: userType,
        tenant_id: userType === 'tenant_user' ? user.tenantId : null,
        expires_at: expiresAt,
        ip_address: '127.0.0.1', // Should come from request in real scenario
        user_agent: 'API', // Should come from request in real scenario
      });

      // Emit token generation event
      this.eventEmitter.emit('auth.token.created', {
        userId: user.id,
        userType: userType,
        tenantId: userType === 'tenant_user' ? user.tenantId : null,
        jti: payload.jti,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getJwtExpiresInSeconds('access'),
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to generate tokens: ${error.message}`);
    }
  }

  // Get JWT expiration time in seconds
  private getJwtExpiresInSeconds(tokenType: 'access' | 'refresh'): number {
    const expiration = tokenType === 'access'
      ? this.configService.get('jwt.accessExpiration')
      : this.configService.get('jwt.refreshExpiration');
    
    // Parse the expiration time (e.g., '15m', '7d')
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes in seconds
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900;
    }
  }

  // Refresh tokens
  async refreshToken(refreshTokenDto: RefreshTokenDto, req: any): Promise<TokenRefreshResponseDto> {
    try {
      // The refresh token strategy already validated the token
      const payload = req.user;
      const refreshTokenId = payload.refreshTokenId;
      
      // Revoke the used refresh token
      await this.refreshTokenRepository.update(refreshTokenId, { is_revoked: true });
      
      // Determine user type
      const userType = payload.tenant_id ? 'tenant_user' : 'system_user';
      
      // Get user data to generate new tokens
      let user: any;
      
      if (userType === 'system_user') {
        user = await this.systemUsersRepository.findOne({ where: { id: payload.sub } });
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        
        user.role = user.role;
        user.permissions = [];
      } else {
        // For tenant users, get from tenant schema
        const schemaName = `tenant_${payload.schema_name}`;
        
        const result = await this.systemDataSource.query(
          `SELECT * FROM ${schemaName}.users WHERE id = $1`,
          [payload.sub]
        );
        
        if (!result || !result[0]) {
          throw new UnauthorizedException('User not found');
        }
        
        user = result[0];
        user.tenantId = payload.tenant_id;
        user.tenantSchemaName = payload.schema_name;
        
        // Get user's role
        const roleResult = await this.systemDataSource.query(
          `SELECT * FROM ${schemaName}.roles WHERE id = $1`,
          [user.role_id]
        );
        
        const role = roleResult[0];
        user.role = role?.name || 'user';
        user.permissions = role?.permissions || [];
      }
      
      // Generate new tokens
      const tokens = await this.generateTokens(user, userType as 'system_user' | 'tenant_user');
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getJwtExpiresInSeconds('access'),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to refresh token: ${error.message}`);
    }
  }

  // Register a new tenant user
  async registerUser(registerDto: RegisterUserDto, req: any): Promise<MessageResponseDto> {
    try {
      // First, verify the tenant exists and is active
      const tenant = await this.tenantsRepository.findOne({
        where: { schema_name: registerDto.tenant, status: 'active' },
      });

      if (!tenant) {
        throw new UnauthorizedException('Invalid tenant or tenant is not active');
      }

      // Create a connection to the tenant schema
      const schemaName = `tenant_${registerDto.tenant}`;
      
      // Check if user already exists
      const existingUser = await this.systemDataSource.query(
        `SELECT * FROM ${schemaName}.users WHERE email = $1 OR username = $2`,
        [registerDto.email, registerDto.username]
      );
      
      if (existingUser && existingUser.length > 0) {
        throw new BadRequestException('User with this email or username already exists');
      }

      // Validate password against tenant password policy
      this.validatePasswordAgainstPolicy(registerDto.password, tenant.auth_settings?.passwordPolicy);

      // Hash the password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      // If no roleId provided, get the default role for new users
      let roleId = registerDto.roleId;
      if (!roleId) {
        const defaultRole = await this.systemDataSource.query(
          `SELECT id FROM ${schemaName}.roles WHERE is_default = true LIMIT 1`
        );
        
        if (defaultRole && defaultRole.length > 0) {
          roleId = defaultRole[0].id;
        } else {
          throw new BadRequestException('No default role found and no role ID provided');
        }
      }
      
      // Create the user
      const result = await this.systemDataSource.query(
        `INSERT INTO ${schemaName}.users 
        (username, email, password, first_name, last_name, phone_number, role_id, status, password_changed_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
        RETURNING id`,
        [
          registerDto.username,
          registerDto.email,
          hashedPassword,
          registerDto.firstName,
          registerDto.lastName,
          registerDto.phoneNumber || null,
          roleId,
          'active'
        ]
      );
      
      const userId = result[0].id;
      
      // Log the registration
      await this.systemDataSource.query(
        `INSERT INTO ${schemaName}.user_logs 
        (user_id, action, ip_address, user_agent) 
        VALUES ($1, 'register', $2, $3)`,
        [userId, req.ip || 'unknown', req.headers['user-agent'] || 'unknown']
      );
      
      // Send welcome notification
      await this.systemDataSource.query(
        `INSERT INTO ${schemaName}.notifications 
        (user_id, title, message, type) 
        VALUES ($1, $2, $3, $4)`,
        [userId, 'Welcome to the platform', `Welcome ${registerDto.firstName}! Your account has been created successfully.`, 'welcome']
      );

      // Emit user created event
      this.eventEmitter.emit('auth.user.created', {
        userId,
        tenantId: tenant.id,
        email: registerDto.email,
      });
      
      return {
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to register user: ${error.message}`);
    }
  }

  // Validate password against tenant password policy
  private validatePasswordAgainstPolicy(password: string, policy: PasswordPolicy): void {
    if (!policy) {
      // Use default policy if none defined for tenant
      policy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventPasswordReuse: false,
        passwordHistoryCount: 0,
        expiryDays: null,
      };
    }
    
    // Check minimum length
    if (password.length < policy.minLength) {
      throw new BadRequestException(`Password must be at least ${policy.minLength} characters long`);
    }
    
    // Check for uppercase letters
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
    
    // Check for special characters
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  // Logout user and revoke tokens
  async logout(user: JwtPayload, req: any): Promise<MessageResponseDto> {
    try {
      // Add the current access token to revoked tokens
      const decodedToken = this.jwtService.decode(req.headers.authorization.split(' ')[1]) as JwtPayload;
      
      if (decodedToken && decodedToken.jti) {
        // Calculate expiration time
        const expiresAt = new Date(decodedToken.exp * 1000);
        
        // Store in database
        await this.revokedTokenRepository.save({
          jti: decodedToken.jti,
          user_id: user.sub,
          user_type: user.tenant_id ? 'tenant_user' : 'system_user',
          tenant_id: user.tenant_id || null,
          expires_at: expiresAt,
          revoked_reason: 'user_logout',
        });
        
        // Also cache in Redis for faster lookup
        await this.cacheManager.set(
          `revoked_token:${decodedToken.jti}`,
          true,
          (expiresAt.getTime() - Date.now()) / 1000
        );
      }
      
      // Revoke all refresh tokens for this user
      await this.refreshTokenRepository.update(
        {
          user_id: user.sub,
          is_revoked: false,
        },
        {
          is_revoked: true,
        }
      );
      
      // Emit logout event
      this.eventEmitter.emit('auth.user.logout', {
        userId: user.sub,
        tenantId: user.tenant_id || null,
      });
      
      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to logout: ${error.message}`);
    }
  }

  // Request password reset
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, req: any): Promise<MessageResponseDto> {
    try {
      if (forgotPasswordDto.tenant) {
        // Tenant user password reset
        const tenant = await this.tenantsRepository.findOne({
          where: { schema_name: forgotPasswordDto.tenant, status: 'active' },
        });

        if (!tenant) {
          // Don't expose that the tenant doesn't exist
          return { message: 'If your email is registered, you will receive a password reset link' };
        }

        const schemaName = `tenant_${forgotPasswordDto.tenant}`;
        
        // Find the user
        const users = await this.systemDataSource.query(
          `SELECT * FROM ${schemaName}.users WHERE email = $1 AND status = 'active'`,
          [forgotPasswordDto.email]
        );
        
        if (!users || users.length === 0) {
          // Don't expose that the email doesn't exist
          return { message: 'If your email is registered, you will receive a password reset link' };
        }
        
        const user = users[0];
        
        // Generate reset token and expiry
        const resetToken = uuidv4();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 24); // Token valid for 24 hours
        
        // Update user with reset token
        await this.systemDataSource.query(
          `UPDATE ${schemaName}.users SET 
            reset_password_token = $1, 
            reset_password_expires = $2 
          WHERE id = $3`,
          [resetToken, resetExpires, user.id]
        );
        
        // In a real implementation, we would send an email with the reset link
        // For now, just log it
        console.log(`Password reset link for ${user.email}: ${this.configService.get('app.url')}/auth/reset-password?token=${resetToken}&tenant=${forgotPasswordDto.tenant}`);
        
        // Emit password reset requested event
        this.eventEmitter.emit('auth.password.reset.requested', {
          userId: user.id,
          tenantId: tenant.id,
          email: user.email,
        });
      } else {
        // System user password reset
        const user = await this.systemUsersRepository.findOne({
          where: { email: forgotPasswordDto.email },
        });
        
        if (!user) {
          // Don't expose that the email doesn't exist
          return { message: 'If your email is registered, you will receive a password reset link' };
        }
        
        // Generate reset token and expiry
        const resetToken = uuidv4();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 24); // Token valid for 24 hours
        
        // Update user with reset token
        await this.systemUsersRepository.update(user.id, {
          reset_password_token: resetToken,
          reset_password_expires: resetExpires,
        });
        
        // In a real implementation, we would send an email with the reset link
        // For now, just log it
        console.log(`Password reset link for system user ${user.email}: ${this.configService.get('app.url')}/auth/reset-password?token=${resetToken}`);
        
        // Emit password reset requested event
        this.eventEmitter.emit('auth.password.reset.requested', {
          userId: user.id,
          userType: 'system_user',
          email: user.email,
        });
      }
      
      return {
        message: 'If your email is registered, you will receive a password reset link',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to process password reset request: ${error.message}`);
    }
  }

  // Reset password with token
  async resetPassword(resetPasswordDto: ResetPasswordDto, req: any): Promise<MessageResponseDto> {
    try {
      // Extract tenant from query params if available
      const tenant = req.query.tenant;
      
      if (tenant) {
        // Tenant user password reset
        const tenantEntity = await this.tenantsRepository.findOne({
          where: { schema_name: tenant, status: 'active' },
        });

        if (!tenantEntity) {
          throw new NotFoundException('Tenant not found or inactive');
        }

        const schemaName = `tenant_${tenant}`;
        
        // Find user with valid reset token
        const users = await this.systemDataSource.query(
          `SELECT * FROM ${schemaName}.users 
          WHERE reset_password_token = $1 
          AND reset_password_expires > NOW()
          AND status = 'active'`,
          [resetPasswordDto.token]
        );
        
        if (!users || users.length === 0) {
          throw new UnauthorizedException('Invalid or expired reset token');
        }
        
        const user = users[0];
        
        // Validate password against tenant password policy
        this.validatePasswordAgainstPolicy(resetPasswordDto.password, tenantEntity.auth_settings?.passwordPolicy);
        
        // Check password history if enabled
        if (tenantEntity.auth_settings?.passwordPolicy?.preventPasswordReuse && 
            tenantEntity.auth_settings?.passwordPolicy?.passwordHistoryCount > 0) {
            
          const passwordHistory = user.password_history || [];
          
          // Check against current password
          const currentPasswordMatch = await bcrypt.compare(resetPasswordDto.password, user.password);
          if (currentPasswordMatch) {
            throw new BadRequestException('New password cannot be the same as current password');
          }
          
          // Check against password history
          for (const oldPassword of passwordHistory) {
            const historyMatch = await bcrypt.compare(resetPasswordDto.password, oldPassword);
            if (historyMatch) {
              throw new BadRequestException('Password has been used recently. Please choose a different password.');
            }
          }
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);
        
        // Update password history
        let updatedPasswordHistory = user.password_history || [];
        updatedPasswordHistory.push(user.password); // Add current password to history
        
        // Limit history size
        const historyLimit = tenantEntity.auth_settings?.passwordPolicy?.passwordHistoryCount || 5;
        if (updatedPasswordHistory.length > historyLimit) {
          updatedPasswordHistory = updatedPasswordHistory.slice(-historyLimit);
        }
        
        // Update user with new password
        await this.systemDataSource.query(
          `UPDATE ${schemaName}.users SET 
            password = $1, 
            reset_password_token = NULL, 
            reset_password_expires = NULL,
            password_changed_at = NOW(),
            password_history = $2
          WHERE id = $3`,
          [hashedPassword, JSON.stringify(updatedPasswordHistory), user.id]
        );
        
        // Revoke all tokens for security
        await this.revokeAllTokensForUser(user.id, 'tenant_user', tenantEntity.id);
        
        // Log the password reset
        await this.systemDataSource.query(
          `INSERT INTO ${schemaName}.user_logs 
          (user_id, action, ip_address, user_agent) 
          VALUES ($1, 'password_reset', $2, $3)`,
          [user.id, req.ip || 'unknown', req.headers['user-agent'] || 'unknown']
        );
        
        // Emit password reset event
        this.eventEmitter.emit('auth.password.reset.completed', {
          userId: user.id,
          tenantId: tenantEntity.id,
          email: user.email,
        });
      } else {
        // System user password reset
        const user = await this.systemUsersRepository.findOne({
          where: { 
            reset_password_token: resetPasswordDto.token,
            reset_password_expires: MoreThan(new Date()),
          },
        });
        
        if (!user) {
          throw new UnauthorizedException('Invalid or expired reset token');
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);
        
        // Update user with new password
        await this.systemUsersRepository.update(user.id, {
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
        });
        
        // Revoke all tokens for security
        await this.revokeAllTokensForUser(user.id, 'system_user');
        
        // Emit password reset event
        this.eventEmitter.emit('auth.password.reset.completed', {
          userId: user.id,
          userType: 'system_user',
          email: user.email,
        });
      }
      
      return {
        message: 'Password has been reset successfully. Please login with your new password.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to reset password: ${error.message}`);
    }
  }

  // Change password for authenticated user
  async changePassword(user: JwtPayload, changePasswordDto: ChangePasswordDto, req: any): Promise<MessageResponseDto> {
    try {
      if (user.tenant_id) {
        // Tenant user password change
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
          throw new UnauthorizedException('User not found or inactive');
        }
        
        const tenantUser = users[0];
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, tenantUser.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Current password is incorrect');
        }
        
        // Validate new password against tenant password policy
        this.validatePasswordAgainstPolicy(changePasswordDto.newPassword, tenant.auth_settings?.passwordPolicy);
        
        // Check password history if enabled
        if (tenant.auth_settings?.passwordPolicy?.preventPasswordReuse && 
            tenant.auth_settings?.passwordPolicy?.passwordHistoryCount > 0) {
            
          const passwordHistory = tenantUser.password_history || [];
          
          // Check if new password is same as current
          if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new BadRequestException('New password cannot be the same as current password');
          }
          
          // Check against password history
          for (const oldPassword of passwordHistory) {
            const historyMatch = await bcrypt.compare(changePasswordDto.newPassword, oldPassword);
            if (historyMatch) {
              throw new BadRequestException('Password has been used recently. Please choose a different password.');
            }
          }
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        
        // Update password history
        let updatedPasswordHistory = tenantUser.password_history || [];
        updatedPasswordHistory.push(tenantUser.password); // Add current password to history
        
        // Limit history size
        const historyLimit = tenant.auth_settings?.passwordPolicy?.passwordHistoryCount || 5;
        if (updatedPasswordHistory.length > historyLimit) {
          updatedPasswordHistory = updatedPasswordHistory.slice(-historyLimit);
        }
        
        // Update user with new password
        await this.systemDataSource.query(
          `UPDATE ${schemaName}.users SET 
            password = $1,
            password_changed_at = NOW(),
            password_history = $2
          WHERE id = $3`,
          [hashedPassword, JSON.stringify(updatedPasswordHistory), user.sub]
        );
        
        // Log the password change
        await this.systemDataSource.query(
          `INSERT INTO ${schemaName}.user_logs 
          (user_id, action, ip_address, user_agent) 
          VALUES ($1, 'password_change', $2, $3)`,
          [user.sub, req.ip || 'unknown', req.headers['user-agent'] || 'unknown']
        );
        
        // Emit password changed event
        this.eventEmitter.emit('auth.password.changed', {
          userId: user.sub,
          tenantId: tenant.id,
        });
      } else {
        // System user password change
        const systemUser = await this.systemUsersRepository.findOne({
          where: { id: user.sub },
        });
        
        if (!systemUser) {
          throw new UnauthorizedException('User not found');
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, systemUser.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Current password is incorrect');
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        
        // Update user with new password
        await this.systemUsersRepository.update(systemUser.id, {
          password: hashedPassword,
        });
        
        // Emit password changed event
        this.eventEmitter.emit('auth.password.changed', {
          userId: systemUser.id,
          userType: 'system_user',
        });
      }
      
      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to change password: ${error.message}`);
    }
  }

  // Helper to revoke all tokens for a user
  private async revokeAllTokensForUser(userId: string, userType: 'system_user' | 'tenant_user', tenantId?: string): Promise<void> {
    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      {
        user_id: userId,
        user_type: userType,
        tenant_id: tenantId || null,
        is_revoked: false,
      },
      {
        is_revoked: true,
      }
    );
  }
}

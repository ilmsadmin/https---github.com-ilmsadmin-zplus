import { Controller, Post, Body, UseGuards, Req, HttpCode, Get, Param, UseInterceptors, ClassSerializerInterceptor, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/auth.interface';
import { 
  LoginDto, 
  SystemLoginDto, 
  RegisterUserDto, 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  ChangePasswordDto
} from './dto/auth-request.dto';
import { 
  LoginResponseDto, 
  MfaRequiredResponseDto, 
  TokenRefreshResponseDto, 
  MessageResponseDto 
} from './dto/auth-response.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA verification required', 
    type: MfaRequiredResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(LocalAuthGuard, ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any): Promise<LoginResponseDto | MfaRequiredResponseDto> {
    return this.authService.login(loginDto, req);
  }

  @ApiOperation({ summary: 'System admin login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MFA verification required', 
    type: MfaRequiredResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(ThrottlerGuard)
  @Post('system-login')
  @HttpCode(HttpStatus.OK)
  async systemLogin(@Body() loginDto: SystemLoginDto, @Req() req: any): Promise<LoginResponseDto | MfaRequiredResponseDto> {
    return this.authService.systemLogin(loginDto, req);
  }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully', 
    type: MessageResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('register')
  async register(@Body() registerDto: RegisterUserDto, @Req() req: any): Promise<MessageResponseDto> {
    return this.authService.registerUser(registerDto, req);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully', 
    type: TokenRefreshResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: any): Promise<TokenRefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto, req);
  }

  @ApiOperation({ summary: 'Logout and revoke tokens' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out successfully', 
    type: MessageResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async logout(@CurrentUser() user: JwtPayload, @Req() req: any): Promise<MessageResponseDto> {
    return this.authService.logout(user, req);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset email sent', 
    type: MessageResponseDto 
  })
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Req() req: any): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto, req);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successful', 
    type: MessageResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: any): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto, req);
  }

  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully', 
    type: MessageResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(user, changePasswordDto, req);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile', 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  async getProfile(@CurrentUser() user: JwtPayload): Promise<any> {
    // Return the user information from the JWT payload
    return {
      id: user.sub,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tenantId: user.tenant_id,
      tenantSchemaName: user.schema_name,
    };
  }

  /* OAuth Routes */

  @ApiOperation({ summary: 'Login with Google OAuth' })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Auth starts by redirecting to Google from here
    // This route doesn't need a body
    return;
  }

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.oauthLogin(req);

    if (tokens.mfaRequired) {
      // Handle MFA redirect
      return res.redirect(
        `${this.configService.get<string>('app.loginSuccessRedirect')}?mfaRequired=true&tempToken=${tokens.tempToken}`
      );
    }
    
    // Set cookies or pass tokens via URL parameters depending on your approach
    return res.redirect(
      `${this.configService.get<string>('app.loginSuccessRedirect')}?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`
    );
  }

  @ApiOperation({ summary: 'Login with Facebook OAuth' })
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // Auth starts by redirecting to Facebook from here
    // This route doesn't need a body
    return;
  }

  @ApiExcludeEndpoint()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.oauthLogin(req);
    
    if (tokens.mfaRequired) {
      // Handle MFA redirect
      return res.redirect(
        `${this.configService.get<string>('app.loginSuccessRedirect')}?mfaRequired=true&tempToken=${tokens.tempToken}`
      );
    }
    
    // Set cookies or pass tokens via URL parameters depending on your approach
    return res.redirect(
      `${this.configService.get<string>('app.loginSuccessRedirect')}?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`
    );
  }
}

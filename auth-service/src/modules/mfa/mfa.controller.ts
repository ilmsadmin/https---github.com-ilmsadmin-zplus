import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MfaService } from './mfa.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/auth.interface';
import { MfaSetupDto, MfaVerifyDto, MfaDisableDto, MfaRecoveryCodeDto } from './dto/mfa.dto';
import { LoginResponseDto, MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Multi-Factor Authentication')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @ApiOperation({ summary: 'Setup MFA for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async setupMfa(
    @CurrentUser() user: JwtPayload,
    @Body() setupDto: MfaSetupDto,
  ): Promise<any> {
    return this.mfaService.setupMfa(user, setupDto);
  }

  @ApiOperation({ summary: 'Verify MFA setup' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup verified',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async verifyMfaSetup(
    @CurrentUser() user: JwtPayload,
    @Body() verifyDto: MfaVerifyDto,
  ): Promise<any> {
    return this.mfaService.verifyMfaSetup(user, verifyDto);
  }

  @ApiOperation({ summary: 'Verify MFA during login' })
  @ApiResponse({
    status: 200,
    description: 'MFA verified, login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(ThrottlerGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(@Body() verifyDto: MfaVerifyDto): Promise<LoginResponseDto> {
    return this.mfaService.verifyMfaLogin(verifyDto);
  }

  @ApiOperation({ summary: 'Disable MFA for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async disableMfa(
    @CurrentUser() user: JwtPayload,
    @Body() disableDto: MfaDisableDto,
  ): Promise<any> {
    return this.mfaService.disableMfa(user, disableDto);
  }

  @ApiOperation({ summary: 'Use recovery code for MFA' })
  @ApiResponse({
    status: 200,
    description: 'Recovery code accepted, login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(ThrottlerGuard)
  @Post('recovery')
  @HttpCode(HttpStatus.OK)
  async useRecoveryCode(@Body() recoveryDto: MfaRecoveryCodeDto): Promise<LoginResponseDto> {
    return this.mfaService.useRecoveryCode(recoveryDto);
  }

  @ApiOperation({ summary: 'Check if user has MFA enabled' })
  @ApiResponse({
    status: 200,
    description: 'MFA status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiBearerAuth()
  async getMfaStatus(@CurrentUser() user: JwtPayload): Promise<any> {
    // In a real implementation, this would query the database to get the current MFA status
    // For now, we just return the information from the JWT
    return {
      isMfaEnabled: user.hasMfa || false,
      method: user.mfaMethod || null,
    };
  }
}

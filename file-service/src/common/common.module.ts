import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '1d'),
        },
      }),
    }),
  ],
  providers: [
    LoggingInterceptor,
    TenantInterceptor,
    AuthGuard,
    TenantGuard,
    RateLimitGuard,
  ],
  exports: [
    JwtModule,
    LoggingInterceptor,
    TenantInterceptor,
    AuthGuard,
    TenantGuard,
    RateLimitGuard,
  ],
})
export class CommonModule {}

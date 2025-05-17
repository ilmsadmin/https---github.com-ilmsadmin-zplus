import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../../../common/interfaces/auth.interface';
import { RevokedToken } from '../entities/revoked-token.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(RevokedToken, 'system')
    private revokedTokensRepository: Repository<RevokedToken>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.accessSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    // Check if token has a JWT ID (jti)
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Check if token has been revoked
    try {
      // First check in Redis cache
      const isRevoked = await this.cacheManager.get(`revoked_token:${payload.jti}`);

      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // If not in cache, check in database
      const revokedToken = await this.revokedTokensRepository.findOne({
        where: { jti: payload.jti },
      });

      if (revokedToken) {
        // Add to cache for future checks
        await this.cacheManager.set(
          `revoked_token:${payload.jti}`,
          true,
          (revokedToken.expires_at.getTime() - Date.now()) / 1000
        );
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to validate token');
    }
  }
}

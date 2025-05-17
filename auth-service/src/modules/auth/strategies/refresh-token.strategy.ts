import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtPayload } from '../../../common/interfaces/auth.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(RefreshToken, 'system')
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    // Check if refresh token exists and is not revoked
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: {
        token: req.body.refreshToken,
        user_id: payload.sub,
        is_revoked: false,
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token has expired
    if (new Date() > refreshToken.expires_at) {
      // Mark token as revoked
      await this.refreshTokenRepository.update(refreshToken.id, { is_revoked: true });
      throw new UnauthorizedException('Refresh token has expired');
    }

    return {
      ...payload,
      refreshTokenId: refreshToken.id,
    };
  }
}

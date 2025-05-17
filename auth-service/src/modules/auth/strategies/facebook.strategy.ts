import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('oauth.facebook.clientId'),
      clientSecret: configService.get('oauth.facebook.clientSecret'),
      callbackURL: configService.get('oauth.facebook.callbackUrl'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      passReqToCallback: true,
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    // Extract tenant from request
    const tenant = request.query.tenant || request.session?.tenant;

    const user = {
      email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      provider: 'facebook',
      providerId: profile.id,
      tenant: tenant,
    };

    done(null, user);
  }
}

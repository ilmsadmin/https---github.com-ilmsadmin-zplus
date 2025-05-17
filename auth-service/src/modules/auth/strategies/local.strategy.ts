import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    // Determine if it's a system user or tenant user based on request
    const tenant = req.body.tenant;
    
    let user;
    if (tenant) {
      // Tenant user login
      user = await this.authService.validateTenantUser(email, password, tenant);
    } else {
      // System user login
      user = await this.authService.validateSystemUser(email, password);
    }
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }
}

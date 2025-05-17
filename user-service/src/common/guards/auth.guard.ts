import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract the bearer token from the Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    try {
      // This is a simplified validation - in a real app, you'd verify the JWT token properly
      // For this example, we'll extract the user ID from the token and check if the user exists
      const userId = this.extractUserIdFromToken(token);
      
      // Check if user exists and is active
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Store user in request object
      request.user = user;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractUserIdFromToken(token: string): string {
    try {
      // This is a placeholder - in a real app, you'd decode and verify the JWT
      // For demonstration purposes only
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString()
      );
      
      if (!payload.sub) {
        throw new Error('Invalid token payload');
      }
      
      return payload.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid token format');
    }
  }
}

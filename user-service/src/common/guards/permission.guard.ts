import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    
    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    // Get user from request (set by AuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }
    
    // Make sure user roles and permissions are loaded
    if (!user.roles || !user.roles.length) {
      throw new ForbiddenException('User roles not loaded');
    }
    
    // Check if user has required permissions
    const userPermissions = this.getUserPermissions(user);
    
    // Check if user has all required permissions
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
  
  private getUserPermissions(user: User): string[] {
    // Extract permissions from all user roles
    return user.roles.reduce((permissions, role) => {
      if (role.permissions) {
        permissions.push(...role.permissions.map(p => p.name));
      }
      return permissions;
    }, [] as string[]);
  }
}

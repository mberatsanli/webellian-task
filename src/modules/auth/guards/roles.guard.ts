import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Authentication failed');
    }

    const user = await request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

    // Validate that user has valid roles
    if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      throw new UnauthorizedException('User must have at least one role');
    }

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Access Denied: Insufficient role');
    }

    return true;
  }
}

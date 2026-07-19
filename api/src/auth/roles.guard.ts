import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { currentUser } from '@/auth/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const user = currentUser(context);
    console.log(user);
    if (!matchRoles(roles, user?.roles ?? [])) {
      throw new UnauthorizedException(
        `Access denied. Required roles: ${roles.toString()}`,
      );
    }
    return true;
  }
}

const matchRoles = (roles: string[], userRoles: string[]): boolean => {
  return roles.some((role) => userRoles.includes(role));
};

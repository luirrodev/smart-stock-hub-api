import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PayloadToken } from 'src/auth/models/token.model';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Obtener los permisos y roles requeridos
    const requiredPermissions = this.reflector.get<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      context.getHandler(),
    );
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // 3. Obtener el usuario del request (asumiendo JWT)
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;

    // 4. Verificar roles (si hay)
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Access denied: Role required ${requiredRoles.join(' or ')}. Your current role is ${user.role}.`,
        );
      }
    }

    // 5. Verificar permisos (si hay)
    if (requiredPermissions) {
      const hasPermission = requiredPermissions.some((p) =>
        user.permissions.includes(p),
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied: you do not have access to ${requiredPermissions}`,
        );
      }
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

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

    // 2. Si no hay restricciones, permitir acceso
    if (!requiredPermissions && !requiredRoles) return true;

    // 3. Obtener el usuario del request (asumiendo JWT)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 4. Verificar roles (si hay)
    if (requiredRoles && !requiredRoles.includes(user.role.name)) {
      return false;
    }

    // 5. Verificar permisos (si hay)
    if (requiredPermissions) {
      const userPermissions = user.role.permissions.map((p) => p.name);
      const hasPermission = requiredPermissions.some((p) =>
        userPermissions.includes(p),
      );
      if (!hasPermission) return false;
    }

    return true;
  }
}

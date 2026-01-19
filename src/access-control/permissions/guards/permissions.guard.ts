import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  PayloadToken,
  UserPermissionsCache,
} from 'src/auth/models/token.model';
import { RolesService } from '../../roles/services/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Obtener los permisos requeridos
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // Si no hay permisos requeridos, permitir acceso (solo autenticación)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Obtener el usuario del request (desde JWT)
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;

    // 3. Obtener permisos actuales desde Redis/DB
    const userPermissions = await this.getUserPermissions(user);

    // 4. Validar versión del rol (protección contra permisos obsoletos)
    await this.validateRoleVersion(user, userPermissions.roleVersion);

    // 5. Verificar permisos
    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.permissions.includes(p),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: You do not have the required permissions to access this resource.`,
      );
    }

    return true;
  }

  /**
   * Obtiene los permisos del usuario desde Redis/DB.
   * Primero intenta desde caché, luego consulta la base de datos.
   */
  private async getUserPermissions(
    user: PayloadToken,
  ): Promise<UserPermissionsCache> {
    const cacheKey = `user:permissions:${user.sub}`;

    // Intentar obtener desde caché
    const cached = await this.cacheManager.get<UserPermissionsCache>(cacheKey);
    if (cached && cached.roleVersion === user.roleVersion) {
      return cached;
    }

    // Si no está en caché o la versión cambió, consultar desde BD
    const role = await this.rolesService.getRoleById(user.roleId);

    const permissionsData: UserPermissionsCache = {
      roleId: role.id,
      roleName: role.name,
      roleVersion: role.version,
      permissions: role.permissions.map((p) => p.name),
    };

    // Guardar en caché (30 minutos)
    await this.cacheManager.set(cacheKey, permissionsData, 1800000);

    return permissionsData;
  }

  /**
   * Valida que la versión del rol en el JWT coincida con la versión actual.
   * Si no coincide, fuerza al usuario a re-autenticarse.
   */
  private async validateRoleVersion(
    user: PayloadToken,
    currentVersion: number,
  ): Promise<void> {
    if (!user.roleId || user.roleVersion === undefined) {
      // Token antiguo sin versión, permitir pero registrar
      console.warn(
        `User ${user.sub} has JWT without roleVersion. Consider re-login.`,
      );
      return;
    }

    if (currentVersion !== user.roleVersion) {
      throw new UnauthorizedException(
        `Your permissions have been updated. Please log in again to refresh your access.`,
      );
    }
  }
}

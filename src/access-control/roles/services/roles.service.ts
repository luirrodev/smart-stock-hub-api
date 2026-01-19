import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Role } from '../entities/role.entity';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { AssignPermissionsDto, CreateRoleDto } from '../dtos/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private permissionsService: PermissionsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(id: number): string {
    return `role:${id}`;
  }

  private getVersionCacheKey(id: number): string {
    return `role:version:${id}`;
  }

  async createRole(data: CreateRoleDto) {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async getAllRoles() {
    return this.roleRepo.find();
  }

  async getRoleById(id: number): Promise<Role> {
    // Intentar obtener del caché
    const cacheKey = this.getCacheKey(id);
    const cachedRole = await this.cacheManager.get<Role>(cacheKey);

    if (cachedRole) {
      return cachedRole;
    }

    // Si no está en caché, consultar la BD
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Guardar en caché (TTL: 1 hora)
    await this.cacheManager.set(cacheKey, role, 3600000);

    // Guardar versión en caché separado
    await this.cacheManager.set(
      this.getVersionCacheKey(id),
      role.version,
      3600000,
    );

    return role;
  }

  async getRoleVersion(id: number): Promise<number> {
    const cacheKey = this.getVersionCacheKey(id);
    const cachedVersion = await this.cacheManager.get<number>(cacheKey);

    if (cachedVersion !== null && cachedVersion !== undefined) {
      return cachedVersion;
    }

    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.cacheManager.set(cacheKey, role.version, 3600000);
    return role.version;
  }

  async assignPermissions(id: number, data: AssignPermissionsDto) {
    const role = await this.getRoleById(id);
    const permissions = await this.permissionsService.findByIds(
      data.permissionIds,
    );

    // Filtrar permisos duplicados
    const existingPermissionIds = new Set(role.permissions.map((p) => p.id));
    const newPermissions = permissions.filter(
      (p) => !existingPermissionIds.has(p.id),
    );

    role.permissions = [...role.permissions, ...newPermissions];

    // Incrementar versión del rol
    role.version += 1;

    const updatedRole = await this.roleRepo.save(role);

    // Invalidar caché
    await this.invalidateRoleCache(id);

    return updatedRole;
  }

  async updateRole(id: number, data: { description: string }) {
    const role = await this.getRoleById(id);
    this.roleRepo.merge(role, data);
    const updatedRole = await this.roleRepo.save(role);

    // Invalidar caché
    await this.invalidateRoleCache(id);

    return updatedRole;
  }

  async deleteRole(id: number) {
    const role = await this.getRoleById(id);

    // Invalidar caché antes de eliminar
    await this.invalidateRoleCache(id);

    return this.roleRepo.remove(role);
  }

  private async invalidateRoleCache(id: number): Promise<void> {
    await this.cacheManager.del(this.getCacheKey(id));
    await this.cacheManager.del(this.getVersionCacheKey(id));
  }
}

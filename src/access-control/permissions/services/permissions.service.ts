import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Permission } from '../entities/permission.entity';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dtos/permission.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from 'src/common/dtos/pagination.dto';

@Injectable()
export class PermissionsService {
  private permissionsVersion = 0;

  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(id: number): string {
    return `permission:${id}`;
  }

  private getAllCacheKey(): string {
    return 'permissions:all';
  }

  private getPaginatedCacheKey(page: number, limit: number): string {
    return `permissions:paginated:v${this.permissionsVersion}:${page}:${limit}`;
  }

  private async invalidateAllPermissionsCache(): Promise<void> {
    this.permissionsVersion++;
    await this.cacheManager.del(this.getAllCacheKey());
  }

  async getAllPermissions(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Permission>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const cacheKey = this.getPaginatedCacheKey(page, limit);
    const cached =
      await this.cacheManager.get<PaginatedResponse<Permission>>(cacheKey);

    if (cached) {
      return cached;
    }

    const [permissions, total] = await this.permissionRepo.findAndCount({
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<Permission> = {
      data: permissions,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };

    await this.cacheManager.set(cacheKey, response, 3600000); // 1 hora
    return response;
  }

  async findByIds(ids: number[]) {
    // Para findByIds no implementamos caché ya que es una consulta dinámica
    return this.permissionRepo.findBy({ id: In(ids) });
  }

  async getPermissionById(id: number) {
    const cacheKey = this.getCacheKey(id);
    const cached = await this.cacheManager.get<Permission>(cacheKey);

    if (cached) {
      return cached;
    }

    const permission = await this.permissionRepo.findOne({
      where: { id },
      relations: ['roles'], // Cargamos los roles relacionados con este permiso
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    await this.cacheManager.set(cacheKey, permission, 3600000);
    return permission;
  }

  async createPermission(data: CreatePermissionDto) {
    const permission = this.permissionRepo.create(data);
    const saved = await this.permissionRepo.save(permission);

    // Invalidar caché de todos los permisos
    await this.invalidateAllPermissionsCache();

    return saved;
  }

  async updatePermission(id: number, data: UpdatePermissionDto) {
    const permission = await this.getPermissionById(id);
    permission.description = data.description;
    const updated = await this.permissionRepo.save(permission);

    // Invalidar caché
    await this.cacheManager.del(this.getCacheKey(id));
    await this.invalidateAllPermissionsCache();

    return updated;
  }
}

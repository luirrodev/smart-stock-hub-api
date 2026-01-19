import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import * as bcrypt from 'bcryptjs';
import { RolesService } from 'src/access-control/roles/services/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly roleService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getCacheKey(id: number): string {
    return `user:${id}`;
  }

  private getEmailCacheKey(email: string): string {
    return `user:email:${email}`;
  }

  private getPermissionsCacheKey(userId: number): string {
    return `user:permissions:${userId}`;
  }

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    const cacheKey = this.getCacheKey(id);
    const cached = await this.cacheManager.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    // Optimización: usar QueryBuilder en lugar de relations
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('This user does not exist');
    }

    // Cachear usuario con TTL de 30 minutos
    await this.cacheManager.set(cacheKey, user, 1800000);

    // Cachear permisos separadamente para el guard
    if (user.role && user.role.permissions) {
      await this.cacheManager.set(
        this.getPermissionsCacheKey(id),
        {
          roleId: user.role.id,
          roleName: user.role.name,
          roleVersion: user.role.version,
          permissions: user.role.permissions.map((p) => p.name),
        },
        1800000,
      );
    }

    return user;
  }

  async findByEmail(email: string) {
    const cacheKey = this.getEmailCacheKey(email);
    const cached = await this.cacheManager.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new NotFoundException('This user does not exist');
    }

    await this.cacheManager.set(cacheKey, user, 1800000);
    await this.cacheManager.set(this.getCacheKey(user.id), user, 1800000);

    return user;
  }

  async getUserPermissionsFromCache(userId: number) {
    return this.cacheManager.get(this.getPermissionsCacheKey(userId));
  }

  async create(data: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('This email is already in use');
    }

    const role = await this.roleService.getRoleById(data.role);
    const { role: role_id, ...userData } = data;

    const newUser = this.userRepo.create(userData);
    newUser.role = role;

    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;

    return this.userRepo.save(newUser);
  }

  async update(id: number, changes: UpdateUserDto) {
    const userToUpdate = await this.findOne(id);

    if (changes.email && changes.email !== userToUpdate.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: changes.email },
      });
      if (existingUser) {
        throw new ConflictException('This email is already in use');
      }
    }

    if (changes.role) {
      const role = await this.roleService.getRoleById(changes.role);
      const { role: roleId, ...otherChanges } = changes;
      this.userRepo.merge(userToUpdate, otherChanges);
      userToUpdate.role = role;
    } else {
      const { role, ...otherChanges } = changes;
      this.userRepo.merge(userToUpdate, otherChanges);
    }

    const updated = await this.userRepo.save(userToUpdate);

    // Invalidar caché del usuario
    await this.invalidateUserCache(id, userToUpdate.email);

    return updated;
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    // Soft delete: marca como eliminado sin borrar físicamente
    await this.userRepo.softDelete(id);

    // Invalidar caché del usuario
    await this.invalidateUserCache(id, user.email);

    return { message: 'User deleted successfully' };
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepo.update(userId, {
      lastLoginAt: new Date(),
    });

    // Invalidar caché del usuario
    await this.cacheManager.del(this.getCacheKey(userId));
  }

  /**
   * Restaurar usuario eliminado (soft delete)
   */
  async restore(id: number): Promise<void> {
    await this.userRepo.restore(id);
    await this.invalidateUserCache(id);
  }

  /**
   * Obtener todos los usuarios incluyendo eliminados
   */
  async findAllWithDeleted() {
    return this.userRepo.find({ withDeleted: true });
  }

  private async invalidateUserCache(id: number, email?: string): Promise<void> {
    await this.cacheManager.del(this.getCacheKey(id));
    await this.cacheManager.del(this.getPermissionsCacheKey(id));
    if (email) {
      await this.cacheManager.del(this.getEmailCacheKey(email));
    }
  }
}

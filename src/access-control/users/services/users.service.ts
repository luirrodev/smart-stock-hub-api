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
import { StaffUsersService } from './staff-users.service';
import * as bcrypt from 'bcryptjs';
import { RolesService } from 'src/access-control/roles/services/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly roleService: RolesService,
    private readonly staffUsersService: StaffUsersService,
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

  async findByEmail(email: string): Promise<User | null> {
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
      return null;
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
      withDeleted: true,
    });
    if (existingUser) {
      throw new ConflictException(
        'Ya existe una cuenta registrada con este correo electrónico',
      );
    }

    const role = await this.roleService.getRoleById(data.role);
    const { role: role_id, ...userData } = data;

    // Don't include password in User entity anymore - it will be handled per-type
    const userDataWithoutPassword = { ...userData };
    delete (userDataWithoutPassword as any).password;

    const newUser = this.userRepo.create(userDataWithoutPassword);
    newUser.role = role;

    const savedUser = await this.userRepo.save(newUser);

    // For STAFF users: create StaffUser with hashed password
    if (role.name !== 'customer' && data.password) {
      await this.staffUsersService.create(savedUser.id, data.password);
    }
    // For CUSTOMER users: password will be set later per-store via StoreUser

    return savedUser;
  }

  async update(id: number, changes: UpdateUserDto): Promise<User> {
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

  /**
   * Cambia la contraseña de un usuario
   * For STAFF users: delegates to StaffUsersService
   * For CUSTOMER users: not supported (passwords managed per-store in StoreUser)
   * @param userId - id del usuario
   * @param newPassword - nueva contraseña en claro
   */
  async changePassword(userId: number, newPassword: string) {
    const user = await this.findOne(userId);

    // For STAFF users: delegate to StaffUsersService
    if (user.role && user.role.name !== 'customer') {
      await this.staffUsersService.updatePassword(userId, newPassword);
    } else {
      // For CUSTOMER users: password management is per-store via StoreUser
      throw new ConflictException(
        'Customer passwords are managed per-store. Use store endpoints to change password.',
      );
    }

    // Invalidar caché del usuario
    await this.invalidateUserCache(userId, user.email);

    return user;
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    // Soft delete: marca como eliminado sin borrar físicamente
    await this.userRepo.softDelete(id);

    // Invalidar caché del usuario
    await this.invalidateUserCache(id, user.email);

    return { message: 'User deleted successfully' };
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

  async setCustomerId(userId: number, customerId: number): Promise<void> {
    // Actualiza directamente la columna customer_id y limpia caché
    await this.userRepo.update(userId, { customerId });
    await this.invalidateUserCache(userId);
  }

  async findCustomerIdByUserId(userId: number): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user?.customerId) {
      throw new NotFoundException('Usuario sin cliente asociado');
    }

    return user.customerId;
  }

  private async invalidateUserCache(id: number, email?: string): Promise<void> {
    await this.cacheManager.del(this.getCacheKey(id));
    await this.cacheManager.del(this.getPermissionsCacheKey(id));
    if (email) {
      await this.cacheManager.del(this.getEmailCacheKey(email));
    }
  }

  async createOAuthUser(data: {
    email: string;
    name: string;
    googleId?: string;
    authProvider: string;
    avatar?: string | null;
    role: number;
  }): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe una cuenta registrada con este correo electrónico',
      );
    }

    const role = await this.roleService.getRoleById(data.role);

    const newUser = new User();
    newUser.email = data.email;
    newUser.name = data.name;
    newUser.avatar = data.avatar || null;
    newUser.role = role;

    const savedUser = await this.userRepo.save(newUser);

    // For STAFF users: create associated StaffUser with OAuth credentials
    if (role.name !== 'customer') {
      await this.staffUsersService.setGoogleCredentials(
        savedUser.id,
        data.googleId || '',
      );
    }
    // For CUSTOMER users: OAuth credentials will be managed per-store via StoreUser

    return savedUser;
  }
}

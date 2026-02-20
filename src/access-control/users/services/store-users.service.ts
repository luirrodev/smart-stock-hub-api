import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { StoreUser } from '../entities/store-user.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { Store } from '../../../stores/entities/store.entity';
import { PasswordResetToken } from '../../../auth/entities/password-reset-token.entity';

@Injectable()
export class StoreUsersService {
  constructor(
    @InjectRepository(StoreUser)
    private storeUsersRepository: Repository<StoreUser>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
  ) {}

  /**
   * Find a store user (customer credentials) by store ID and email
   */
  async findByStoreAndEmail(
    storeId: number,
    email: string,
  ): Promise<StoreUser | null> {
    return this.storeUsersRepository
      .createQueryBuilder('su')
      .innerJoinAndSelect('su.customer', 'c')
      .innerJoinAndSelect('c.user', 'u')
      .where('su.store_id = :storeId', { storeId })
      .andWhere('u.email = :email', { email })
      .getOne();
  }

  /**
   * Find a store user by ID
   */
  async findById(id: number): Promise<StoreUser | null> {
    return this.storeUsersRepository.findOne({
      where: { id },
      relations: ['customer', 'store'],
    });
  }

  /**
   * Get all store users for a specific store
   */
  async findByStoreId(storeId: number): Promise<StoreUser[]> {
    return this.storeUsersRepository.find({
      where: { storeId, isActive: true },
      relations: ['customer'],
    });
  }

  /**
   * Get all stores where a customer is registered
   */
  async findStoresForCustomer(customerId: number): Promise<StoreUser[]> {
    return this.storeUsersRepository.find({
      where: { customerId, isActive: true },
      relations: ['store'],
      order: { storeId: 'ASC' },
    });
  }

  /**
   * Register a customer to a store with credentials
   */
  async registerCustomerToStore(
    storeId: number,
    customerId: number,
    password?: string,
  ): Promise<StoreUser> {
    // Validate store exists
    const store = await this.storesRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    // Validate customer exists
    const customer = await this.customersRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    // Check if already registered
    const existing = await this.storeUsersRepository.findOne({
      where: { storeId, customerId },
    });
    if (existing) {
      throw new ConflictException(
        `Este cliente ya está registrado en esta tienda`,
      );
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create StoreUser
    const storeUser = this.storeUsersRepository.create({
      storeId,
      customerId,
      password: hashedPassword,
      credentials: {
        authProvider: password ? 'local' : undefined,
      },
      isActive: true,
    });

    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Change password for a customer in a store
   */
  async changePassword(
    storeUserId: number,
    newPassword: string,
  ): Promise<StoreUser> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    if (!newPassword || newPassword.trim().length < 8) {
      throw new BadRequestException('Password debe tener mínimo 8 caracteres');
    }

    // Validate that new password is different from the old one
    if (storeUser.password) {
      const isSameAsOld = await bcrypt.compare(newPassword, storeUser.password);
      if (isSameAsOld) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la anterior',
        );
      }
    }

    storeUser.password = await bcrypt.hash(newPassword, 10);
    storeUser.credentials = {
      ...storeUser.credentials,
      authProvider: 'local',
    };

    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Set Google OAuth credentials for a customer in a store
   */
  async setGoogleCredentials(
    storeUserId: number,
    googleId: string,
  ): Promise<StoreUser> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    storeUser.credentials = {
      ...storeUser.credentials,
      googleId,
      authProvider: 'google',
    };

    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Deactivate a customer in a store
   */
  async deactivate(storeUserId: number): Promise<StoreUser> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    storeUser.isActive = false;
    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Activate a customer in a store
   */
  async activate(storeUserId: number): Promise<StoreUser> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    storeUser.isActive = true;
    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(storeUserId: number): Promise<StoreUser> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    storeUser.lastLoginAt = new Date();
    return this.storeUsersRepository.save(storeUser);
  }

  /**
   * Verify password for a store user (customer)
   */
  async verifyPassword(
    storeUserId: number,
    plainPassword: string,
  ): Promise<boolean> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser || !storeUser.password) {
      return false;
    }

    return bcrypt.compare(plainPassword, storeUser.password);
  }

  /**
   * Request password reset for a customer in a store
   */
  async forgotPasswordStoreUser(
    email: string,
    storeId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Find StoreUser by email and store
      const storeUser = await this.findByStoreAndEmail(storeId, email);

      // Validate StoreUser exists and is active
      if (!storeUser || !storeUser.isActive) {
        return; // Generic response for security
      }

      // Validate Customer exists and is not deleted
      if (!storeUser.customer || storeUser.customer.deletedAt) {
        return; // Generic response for security
      }

      // Validate Store exists and is active
      if (!storeUser.store) {
        return; // Generic response for security
      }

      // Generate random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(rawToken, 10);

      // Calculate expiration time
      const expiresInMs = process.env.PASSWORD_RESET_EXPIRES_IN
        ? Number(process.env.PASSWORD_RESET_EXPIRES_IN) * 1000
        : 3600_000; // 1 hour by default
      const expiresAt = new Date(Date.now() + expiresInMs);

      // Invalidate previous tokens
      const prevTokens = await this.passwordResetRepo.find({
        where: {
          storeUser: { id: storeUser.id },
          used: false,
          revokedAt: IsNull(),
        },
      });

      if (prevTokens && prevTokens.length) {
        const now = new Date();
        prevTokens.forEach((t) => {
          t.used = true;
          t.revokedAt = now;
        });
        await this.passwordResetRepo.save(prevTokens);
      }

      // Create new token
      const tokenEntity = this.passwordResetRepo.create({
        token: hashedToken,
        storeUser: storeUser,
        expiresAt,
        sentAt: new Date(),
        ipAddress,
        userAgent,
      } as Partial<PasswordResetToken>);

      await this.passwordResetRepo.save(tokenEntity);

      // TODO: Send email with rawToken
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&storeId=${storeId}`;
      // await this.mailerService.sendPasswordResetEmail(email, resetLink);
    } catch (error) {
      // Log the error but don't throw (generic response for security)
      console.error('Error in forgotPasswordStoreUser:', error);
      return;
    }
  }

  /**
   * Validate a password reset token for a store user
   */
  async validatePasswordResetTokenForStoreUser(
    rawToken: string,
    storeId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordResetToken> {
    // Find all candidate tokens (not used, not revoked)
    const candidates = await this.passwordResetRepo.find({
      where: {
        used: false,
        revokedAt: IsNull(),
        storeUser: { storeId },
      },
      relations: ['storeUser'],
      order: { createdAt: 'DESC' },
    });

    if (!candidates || candidates.length === 0) {
      throw new BadRequestException('Token inválido');
    }

    const now = new Date();

    for (const t of candidates) {
      // Compare token with bcrypt
      const match = await bcrypt.compare(rawToken, t.token);
      if (match) {
        // Validate token state
        if (t.used) {
          throw new BadRequestException('Token ya fue usado');
        }
        if (t.expiresAt && t.expiresAt <= now) {
          throw new GoneException('Token expirado');
        }

        // Validate StoreUser is still active
        if (!t.storeUser || !t.storeUser.isActive) {
          throw new UnauthorizedException(
            'El usuario de tienda no está activo',
          );
        }

        // Validate Store exists
        const store = await this.storesRepository.findOne({
          where: { id: t.storeUser.storeId },
        });
        if (!store) {
          throw new UnauthorizedException('La tienda no existe');
        }

        // Increment attempts
        t.attempts = (t.attempts || 0) + 1;

        // Revoke if too many attempts
        if (t.attempts > 5) {
          t.revokedAt = now;
        }

        // Update IP and UserAgent
        if (ipAddress) t.ipAddress = ipAddress;
        if (userAgent) t.userAgent = userAgent;

        await this.passwordResetRepo.save(t);

        // Check attempts again
        if (t.attempts > 5) {
          throw new BadRequestException('Demasiados intentos. Token revocado');
        }

        return t;
      }
    }

    // No match found
    throw new BadRequestException('Token inválido');
  }

  /**
   * Reset password for a customer in a store using a token
   */
  async resetPasswordForStoreUser(
    rawToken: string,
    storeId: number,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<StoreUser> {
    // Validate token
    const tokenEntity = await this.validatePasswordResetTokenForStoreUser(
      rawToken,
      storeId,
      ipAddress,
      userAgent,
    );

    if (!tokenEntity.storeUser) {
      throw new UnauthorizedException(
        'Token inválido: StoreUser no encontrado',
      );
    }

    const storeUserId = tokenEntity.storeUser.id;

    // Change password
    const storeUser = await this.changePassword(storeUserId, newPassword);

    // Mark token as used
    tokenEntity.used = true;
    tokenEntity.usedAt = new Date();
    tokenEntity.revokedAt = new Date();
    if (ipAddress) tokenEntity.ipAddress = ipAddress;
    if (userAgent) tokenEntity.userAgent = userAgent;

    await this.passwordResetRepo.save(tokenEntity);

    // Invalidate other active tokens for this StoreUser
    const otherTokens = await this.passwordResetRepo.find({
      where: {
        storeUser: { id: storeUserId },
        used: false,
        revokedAt: IsNull(),
      },
    });
    if (otherTokens && otherTokens.length) {
      const now = new Date();
      otherTokens.forEach((t) => {
        t.used = true;
        t.revokedAt = now;
      });
      await this.passwordResetRepo.save(otherTokens);
    }

    return storeUser;
  }

  /**
   * Unregister customer from store (soft delete)
   */
  async unregisterFromStore(storeUserId: number): Promise<void> {
    const storeUser = await this.findById(storeUserId);
    if (!storeUser) {
      throw new NotFoundException(`StoreUser ${storeUserId} not found`);
    }

    await this.storeUsersRepository.softRemove(storeUser);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { StaffUser } from '../entities/staff-user.entity';
import { PasswordResetToken } from '../../../auth/entities/password-reset-token.entity';

@Injectable()
export class StaffUsersService {
  constructor(
    @InjectRepository(StaffUser)
    private staffUsersRepository: Repository<StaffUser>,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
  ) {}

  /**
   * Create a new StaffUser with optional password and/or googleId
   */
  async create(
    userId: number,
    password?: string,
    googleId?: string,
  ): Promise<StaffUser> {
    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const staffUser = this.staffUsersRepository.create({
      userId,
      password: hashedPassword,
      googleId: googleId || null,
      authProvider: password ? 'local' : googleId ? 'google' : 'local',
      isActive: true,
    });

    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Find StaffUser by User ID (OneToOne relationship)
   */
  async findByUserId(userId: number): Promise<StaffUser | null> {
    return this.staffUsersRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  /**
   * Find StaffUser by ID
   */
  async findOne(id: number): Promise<StaffUser | null> {
    return this.staffUsersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * Get all active staff users
   */
  async findAll(): Promise<StaffUser[]> {
    return this.staffUsersRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });
  }

  /**
   * Update last login timestamp for STAFF user
   */
  async updateLastLogin(userId: number): Promise<StaffUser> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser) {
      throw new NotFoundException(`No StaffUser found for userId ${userId}`);
    }

    staffUser.lastLoginAt = new Date();
    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Update password for STAFF user
   */
  async updatePassword(
    userId: number,
    newPassword: string,
  ): Promise<StaffUser> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser) {
      throw new NotFoundException(`No StaffUser found for userId ${userId}`);
    }

    if (!newPassword || newPassword.trim().length < 8) {
      throw new BadRequestException('Password debe tener mínimo 8 caracteres');
    }

    // Validate that new password is different from the old one
    if (staffUser.password) {
      const isSameAsOld = await bcrypt.compare(newPassword, staffUser.password);
      if (isSameAsOld) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la anterior',
        );
      }
    }

    staffUser.password = await bcrypt.hash(newPassword, 10);
    staffUser.authProvider = 'local';

    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Set Google OAuth credentials for STAFF user
   */
  async setGoogleCredentials(
    userId: number,
    googleId: string,
  ): Promise<StaffUser> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser) {
      throw new NotFoundException(`No StaffUser found for userId ${userId}`);
    }

    staffUser.googleId = googleId;
    staffUser.authProvider = 'google';

    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Deactivate STAFF user
   */
  async deactivate(userId: number): Promise<StaffUser> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser) {
      throw new NotFoundException(`No StaffUser found for userId ${userId}`);
    }

    staffUser.isActive = false;
    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Activate STAFF user
   */
  async activate(userId: number): Promise<StaffUser> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser) {
      throw new NotFoundException(`No StaffUser found for userId ${userId}`);
    }

    staffUser.isActive = true;
    return this.staffUsersRepository.save(staffUser);
  }

  /**
   * Verify password for STAFF user
   */
  async verifyPassword(
    userId: number,
    plainPassword: string,
  ): Promise<boolean> {
    const staffUser = await this.findByUserId(userId);
    if (!staffUser || !staffUser.password) {
      return false;
    }

    return bcrypt.compare(plainPassword, staffUser.password);
  }

  /**
   * Request password reset for a staff user (global, not store-specific)
   */
  async forgotPasswordStaff(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Find staff user by email
      const staffUser = await this.staffUsersRepository.findOne({
        where: { user: { email } },
        relations: ['user'],
      });

      // Validate StaffUser exists and is active
      if (!staffUser || !staffUser.isActive) {
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
          user: { id: staffUser.user.id },
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
        user: staffUser.user,
        expiresAt,
        sentAt: new Date(),
        ipAddress,
        userAgent,
      } as Partial<PasswordResetToken>);

      await this.passwordResetRepo.save(tokenEntity);

      // TODO: Send email with rawToken
      console.log(
        `Password reset token for StaffUser ${staffUser.id}: ${rawToken} (expires at ${expiresAt.toISOString()})`,
      );
    } catch (error) {
      // Log the error but don't throw (generic response for security)
      console.error('Error in forgotPasswordStaff:', error);
      return;
    }
  }

  /**
   * Validate a password reset token for a staff user
   */
  async validatePasswordResetTokenStaff(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordResetToken> {
    // Find all candidate tokens (not used, not revoked) for staff users only
    const candidates = await this.passwordResetRepo.find({
      where: {
        used: false,
        revokedAt: IsNull(),
        user: {},
        storeUser: IsNull(),
      },
      relations: ['user'],
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

        // Validate User exists
        if (!t.user) {
          throw new BadRequestException(
            'Token inválido: Usuario no encontrado',
          );
        }

        // Validate StaffUser is still active
        const staffUser = await this.findByUserId(t.user.id);
        if (!staffUser || !staffUser.isActive) {
          throw new BadRequestException('El usuario de staff no está activo');
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
   * Reset password for a staff user using a token
   */
  async resetPasswordStaff(
    rawToken: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<StaffUser> {
    // Validate token
    const tokenEntity = await this.validatePasswordResetTokenStaff(
      rawToken,
      ipAddress,
      userAgent,
    );

    if (!tokenEntity.user) {
      throw new BadRequestException('Token inválido: Usuario no encontrado');
    }

    const userId = tokenEntity.user.id;

    // Change password
    const staffUser = await this.updatePassword(userId, newPassword);

    // Mark token as used
    tokenEntity.used = true;
    tokenEntity.usedAt = new Date();
    tokenEntity.revokedAt = new Date();
    if (ipAddress) tokenEntity.ipAddress = ipAddress;
    if (userAgent) tokenEntity.userAgent = userAgent;

    await this.passwordResetRepo.save(tokenEntity);

    // Invalidate other active tokens for this User
    const otherTokens = await this.passwordResetRepo.find({
      where: {
        user: { id: userId },
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

    return staffUser;
  }

  /**
   * Get profile information for a staff user
   * Used by v2 controller for staff user profile endpoint
   */
  async getProfileStaff(userId: number) {
    const staffUser = await this.staffUsersRepository.findOne({
      where: { userId },
      relations: ['user', 'user.role', 'user.role.permissions'],
    });

    if (!staffUser) {
      throw new NotFoundException('StaffUser not found');
    }

    const { user } = staffUser;

    if (!user) {
      throw new NotFoundException('User information not found');
    }

    return {
      id: staffUser.id,
      userId: user.id,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      role: user.role?.name || 'staff',
      permissions: user.role?.permissions?.map((p) => p.name) || [],
      isActive: staffUser.isActive,
      createdAt: staffUser.createdAt,
    };
  }
}

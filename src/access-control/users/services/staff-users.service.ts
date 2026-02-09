import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { StaffUser } from '../entities/staff-user.entity';

@Injectable()
export class StaffUsersService {
  constructor(
    @InjectRepository(StaffUser)
    private staffUsersRepository: Repository<StaffUser>,
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
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
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
}

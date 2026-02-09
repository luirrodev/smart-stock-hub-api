import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { StoreUser } from '../entities/store-user.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { Store } from '../../../stores/entities/store.entity';

@Injectable()
export class StoreUsersService {
  constructor(
    @InjectRepository(StoreUser)
    private storeUsersRepository: Repository<StoreUser>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  /**
   * Find a store user (customer credentials) by store ID and email
   */
  async findByStoreAndEmail(
    storeId: number,
    email: string,
  ): Promise<StoreUser | null> {
    const storeUser = await this.storeUsersRepository.findOne({
      where: { storeId },
      relations: ['customer', 'store'],
    });

    if (storeUser && storeUser.customer.user?.email === email) {
      return storeUser;
    }

    return null;
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
        `Customer ${customerId} already registered in store ${storeId}`,
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
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
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

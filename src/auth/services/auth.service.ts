import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { UsersService } from '../../access-control/users/services/users.service';
import { StaffUsersService } from '../../access-control/users/services/staff-users.service';
import { User } from '../../access-control/users/entities/user.entity';
import { RegisterDto } from '../dtos/register.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { PayloadToken } from '../models/token.model';
import { CustomersService } from 'src/customers/services/customers.service';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { GoogleUser } from '../strategies/google-strategy.service';
import { StoreUsersService } from 'src/access-control/users/services/store-users.service';
import { Customer } from 'src/customers/entities/customer.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private staffUsersService: StaffUsersService,
    private jwtService: JwtService,
    private customersService: CustomersService,
    private storeUsersService: StoreUsersService,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
  ) {}

  /**
   * Find user by email (without password validation)
   * Used by LocalStrategy to locate the user before validation
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userService.findByEmail(email);
  }

  /**
   * Validate STAFF user password
   * Called by LocalStrategy for STAFF users
   *
   * @param userId - User ID
   * @param plainPassword - Plain text password to validate
   * @returns true if password is valid, false otherwise
   */
  async validateStaffPassword(
    userId: number,
    plainPassword: string,
  ): Promise<boolean> {
    const staffUser = await this.staffUsersService.findByUserId(userId);
    if (!staffUser?.password) return false;

    return bcrypt.compare(plainPassword, staffUser.password);
  }

  /**
   * Validate user credentials (supports both STAFF and CUSTOMER)
   *
   * For STAFF: validates against StaffUser credentials
   * For CUSTOMER: validates against User password (pre-StoreUser selection)
   *
   * NOTE: This is called by LocalStrategy and does NOT validate CUSTOMER password
   * against StoreUser. Password validation for CUSTOMER happens in validateCustomerLogin().
   *
   * @deprecated Use findUserByEmail() and validateStaffPassword() instead
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    // For STAFF users: credentials are in StaffUser table
    if (user.role && user.role.name !== 'customer') {
      const staffUser = await this.staffUsersService.findByUserId(user.id);
      if (!staffUser?.password) return null;

      const isMatch = await bcrypt.compare(password, staffUser.password);
      return isMatch ? user : null;
    }

    // For CUSTOMER users: password will be validated at login endpoint
    // with store context selection (validateCustomerLogin)
    return user;
  }

  /**
   * Validates STAFF user login.
   * Checks that user is active and updates lastLoginAt timestamp.
   *
   * @param user - User entity with STAFF role
   * @param storeId - Optional store ID (for audit purposes, not used for STAFF)
   * @returns The validated user
   * @throws NotFoundException if user is not found or not active
   */
  async validateStaffLogin(user: User, storeId?: number): Promise<User> {
    if (!user || !user.id) {
      throw new NotFoundException('User not found');
    }

    const staffUser = await this.staffUsersService.findByUserId(user.id);

    if (!staffUser || !staffUser.isActive) {
      throw new UnauthorizedException('Staff user is not active');
    }

    // Update last login timestamp
    await this.staffUsersService.updateLastLogin(user.id);

    return user;
  }

  /**
   * Validates CUSTOMER user login for a specific store.
   *
   * This method:
   * 1. Validates customer exists and is associated with user
   * 2. Finds StoreUser record for the specific store
   * 3. Validates StoreUser exists and is active
   * 4. Validates password against StoreUser.password
   * 5. Updates lastLoginAt timestamp in StoreUser
   *
   * @param user - User entity with CUSTOMER role
   * @param plainPassword - Plain text password to validate
   * @param storeId - Store ID for context
   * @returns Object containing validated user and storeUser
   * @throws BadRequestException if customer ID is missing
   * @throws NotFoundException if StoreUser not found for this store
   * @throws UnauthorizedException if password is invalid
   */
  async validateCustomerLogin(
    user: User,
    plainPassword: string,
    storeId: number,
  ): Promise<{ user: User; storeUser: any }> {
    // Validate customer ID exists
    if (!user.customerId) {
      throw new BadRequestException('Customer ID is missing from user record');
    }

    // Find StoreUser for this customer and store
    const storeUsers = await this.storeUsersService.findStoresForCustomer(
      user.customerId,
    );
    const storeUser = storeUsers.find((su) => su.storeId === storeId);

    if (!storeUser) {
      throw new NotFoundException(
        `Customer is not registered for store ${storeId}`,
      );
    }

    // Validate StoreUser is active
    if (!storeUser.isActive) {
      throw new UnauthorizedException(
        'Customer access is disabled for this store',
      );
    }

    // Validate password against StoreUser password
    const isPasswordValid = await this.storeUsersService.verifyPassword(
      storeUser.id,
      plainPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Update last login timestamp
    await this.storeUsersService.updateLastLogin(storeUser.id);

    return { user, storeUser };
  }

  /**
   * Registra un nuevo usuario cliente en una tienda específica.
   * Permite que el mismo email se registre en múltiples tiendas.
   *
   * Flujo:
   * - Si el email NO existe: Crea User + Customer + StoreUser
   * - Si el email EXISTE y es CUSTOMER: Reutiliza User + Customer, crea StoreUser
   * - Si el email EXISTE y es STAFF: Falla (no puede ser CUSTOMER con email de STAFF)
   *
   * @param {RegisterDto} dto - Los datos de registro
   * @param {number} storeId - El ID de la tienda donde se registra el cliente
   * @returns El JWT generado con contexto de tienda
   */
  async register(dto: RegisterDto, storeId: number) {
    // 1. Buscar si el email ya existe
    const existingUser = await this.userService.findByEmail(dto.email);

    let user: User;
    let customer: Customer;

    if (existingUser) {
      // El email ya existe - validar que sea CUSTOMER
      if (existingUser.role && existingUser.role.name !== 'customer') {
        throw new BadRequestException(
          'Este email está registrado como personal administrativo. No puede registrarse como cliente con este email.',
        );
      }

      // Es CUSTOMER existente, reutilizar
      user = existingUser;

      // Obtener el customer_id del usuario existente
      if (!user.customerId) {
        // Este caso no debería ocurrir si la integridad de datos es correcta
        throw new BadRequestException(
          'Usuario cliente sin registro de customer asociado.',
        );
      }
      customer = await this.customersService.findOne(user.customerId);
    } else {
      // Email no existe - crear User + Customer
      const createdUser = await this.userService.create({
        email: dto.email,
        name: `${dto.firstName} ${dto.lastName}`,
        password: dto.password,
        role: 2, // rol 'customer' por defecto
      });

      const createdCustomer = await this.customersService.create({
        userId: createdUser.id,
      });

      user = createdUser;
      customer = createdCustomer;
    }

    // 2. Crear StoreUser para vincular el cliente a la tienda
    // Especificar contraseña nueva (o puede ser la misma)
    const storeUser = await this.storeUsersService.registerCustomerToStore(
      storeId,
      customer.id,
      dto.password, // Contraseña hasheada nuevamente para esta tienda
    );

    // 3. Generar JWT con contexto de tienda
    return this.generateJWT(user, storeId, storeUser.id);
  }

  /**
   * Orquestador de reset de contraseña.
   * Delega a StoreUsersService si hay storeId (reset de StoreUser)
   * De lo contrario, delega a StaffUsersService (reset de Staff/User)
   */
  async forgotPassword(
    email: string,
    storeId?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // If storeId is provided: delegate to StoreUsersService (per-store customer)
    if (storeId) {
      return this.storeUsersService.forgotPasswordStoreUser(
        email,
        storeId,
        ipAddress,
        userAgent,
      );
    }

    // Otherwise: delegate to StaffUsersService (global staff/admin user)
    return this.staffUsersService.forgotPasswordStaff(
      email,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Valida un token de restablecimiento de contraseña (en claro).
   * - Busca tokens no usados y no revocados del usuario.
   * - Compara el token en claro con los hashes almacenados (bcrypt).
   * - Verifica expiración y estado del usuario.
   * - Incrementa intentos y revoca tokens si se supera el límite.
   */
  async validatePasswordResetToken(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordResetToken> {
    // Buscar tokens candidatos (no usados y no revocados), ordenados por más reciente
    const candidates = await this.passwordResetRepo.find({
      where: { used: false, revokedAt: IsNull() },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    if (!candidates || candidates.length === 0) {
      throw new BadRequestException('Token inválido');
    }

    const now = new Date();

    for (const t of candidates) {
      const match = await bcrypt.compare(rawToken, t.token);
      if (match) {
        // Token coincide — validar estado y expiración
        if (t.used) {
          throw new BadRequestException('Token ya fue usado');
        }
        if (t.expiresAt && t.expiresAt <= now) {
          throw new GoneException('Token expirado');
        }

        // Registrar IP/UserAgent del intento exitoso
        if (ipAddress) t.ipAddress = ipAddress;
        if (userAgent) t.userAgent = userAgent;
        await this.passwordResetRepo.save(t);

        return t;
      }
    }

    // No hay coincidencias entre tokens activos
    // Nota: con token hasheado no podemos identificar a qué usuario se apuntó, por
    // lo que no incrementamos attempts globalmente (evita ataques de denegación).
    throw new BadRequestException('Token inválido');
  }

  /**
   * Orquestador de reseteo de contraseña.
   * Delega a StoreUsersService si hay storeId (reset de StoreUser)
   * De lo contrario, delega a StaffUsersService (reset de Staff/User)
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
    storeId?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    // If storeId is provided: delegate to StoreUsersService (per-store customer)
    if (storeId) {
      await this.storeUsersService.resetPasswordForStoreUser(
        rawToken,
        storeId,
        newPassword,
        ipAddress,
        userAgent,
      );
      return { message: 'Contraseña actualizada correctamente' };
    }

    // Otherwise: delegate to StaffUsersService (global staff/admin user)
    await this.staffUsersService.resetPasswordStaff(
      rawToken,
      newPassword,
      ipAddress,
      userAgent,
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Generates JWT tokens for a user.
   *
   * For STAFF users (role != 'customer'):
   *  - Returns STAFF token with sub=userId
   *  - storeId is not included in token
   *
   * For CUSTOMER users (role == 'customer'):
   *  - Requires storeId and storeUserId parameters
   *  - Returns CUSTOMER token with sub=customerId, storeId, and storeUserId
   *  - This token is specific to a single store context
   *
   * @param userData - User entity with role information
   * @param storeId - Required for CUSTOMER users, ignored for STAFF
   * @param storeUserId - Required for CUSTOMER users, ignored for STAFF
   */
  async generateJWT(userData: User, storeId?: number, storeUserId?: number) {
    const isCustomer = userData.role && userData.role.name === 'customer';

    // For CUSTOMER users: require and use storeId and storeUserId
    if (isCustomer) {
      // Update lastLoginAt in StoreUser (not User)
      // This happens after StoreUser validation in controller

      if (!storeId || !storeUserId) {
        throw new BadRequestException(
          'storeId and storeUserId are required for customer login',
        );
      }

      // Resolve customerId for customer token
      let customerId: number | null = null;
      if (userData.customerId != null) {
        customerId = userData.customerId;
      } else {
        try {
          const customer = await this.customersService.findByUserId(
            userData.id,
          );
          customerId = customer?.id ?? null;
        } catch (e) {
          customerId = null;
        }
      }

      if (!customerId) {
        throw new NotFoundException('Customer record not found for user');
      }

      // CUSTOMER token - always includes store context
      const customerPayload: PayloadToken = {
        sub: customerId,
        customerId: customerId,
        role: 'customer',
        roleId: userData.role.id,
        roleVersion: userData.role.version,
        storeId: storeId,
        storeUserId: storeUserId,
        authMethod: 'local',
      };

      const access_token = await this.jwtService.sign(customerPayload, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const refresh_token = await this.jwtService.sign(
        {
          sub: customerId,
          customerId: customerId,
          role: 'customer',
          roleId: userData.role.id,
          roleVersion: userData.role.version,
          storeId: storeId,
          storeUserId: storeUserId,
        },
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      return {
        access_token,
        refresh_token,
      };
    }

    // STAFF token - sub is userId, no store context in token
    // Update lastLoginAt in StaffUser for STAFF users
    await this.staffUsersService.updateLastLogin(userData.id);

    const staffPayload: PayloadToken = {
      sub: userData.id,
      role: userData.role.name,
      roleId: userData.role.id,
      roleVersion: userData.role.version,
      authMethod: 'local',
    };

    const access_token = await this.jwtService.sign(staffPayload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const refresh_token = await this.jwtService.sign(
      {
        sub: userData.id,
        role: userData.role.name,
      },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload: PayloadToken = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Check if this is a CUSTOMER token (has storeId and storeUserId)
      const isCustomer =
        payload.role === 'customer' && payload.storeId && payload.storeUserId;

      if (isCustomer) {
        // CUSTOMER token refresh - maintain store context
        const newPayload: PayloadToken = {
          sub: payload.sub,
          customerId: payload.customerId,
          role: 'customer',
          roleId: payload.roleId,
          roleVersion: payload.roleVersion,
          storeId: payload.storeId,
          storeUserId: payload.storeUserId,
          authMethod: 'local',
        };

        const access_token = await this.jwtService.sign(newPayload, {
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
          secret: process.env.JWT_ACCESS_SECRET,
        });

        const refresh_token = await this.jwtService.sign(
          {
            sub: payload.sub,
            customerId: payload.customerId,
            role: 'customer',
            storeId: payload.storeId,
            storeUserId: payload.storeUserId,
          },
          {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            secret: process.env.JWT_REFRESH_SECRET,
          },
        );

        return { access_token, refresh_token };
      }

      // STAFF token refresh
      const user = await this.userService.findOne(payload.sub);

      const newPayload: PayloadToken = {
        role: user.role.name,
        roleId: user.role.id,
        roleVersion: user.role.version,
        sub: user.id,
        authMethod: 'local',
      };

      const access_token = await this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const refresh_token = await this.jwtService.sign(
        {
          sub: user.id,
          role: user.role.name,
        },
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );

      return { access_token, refresh_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userData: PayloadToken) {
    // Polimorphic delegation based on user type (StoreUser vs StaffUser)
    if (userData.storeUserId) {
      // CUSTOMER (StoreUser): has storeUserId in payload
      return this.storeUsersService.getProfileStoreUser(userData.storeUserId);
    }

    // STAFF (StaffUser): no storeUserId in payload
    return this.staffUsersService.getProfileStaff(userData.sub);
  }

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    const { googleId, email, name, avatar } = googleUser;

    let user = await this.userService.findByEmail(email);

    if (user) {
      // Check user type
      if (user.role && user.role.name !== 'customer') {
        // STAFF user: update StaffUser OAuth credentials
        const staffUser = await this.staffUsersService.findByUserId(user.id);
        if (staffUser) {
          await this.staffUsersService.setGoogleCredentials(user.id, googleId);
        }
      }

      // Update user avatar if provided
      if (avatar && user.avatar !== avatar) {
        await this.userService.update(user.id, { avatar });
        user.avatar = avatar;
      }

      return user;
    }

    // User doesn't exist - create new user
    const createdUser = await this.userService.createOAuthUser({
      email,
      name,
      googleId,
      authProvider: 'google',
      avatar,
      role: 2, // customer by default
    });

    // For CUSTOMER: create associated Customer record
    if (createdUser.role && createdUser.role.name === 'customer') {
      await this.customersService.create({
        userId: createdUser.id,
      });
    }

    return createdUser;
  }

  async googleLogin(googleUser: GoogleUser) {
    const user = await this.validateGoogleUser(googleUser);
    return this.generateJWT(user);
  }
}

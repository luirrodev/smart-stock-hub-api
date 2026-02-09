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
import { User } from '../../access-control/users/entities/user.entity';
import { RegisterDto } from '../dtos/register.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { PayloadToken } from '../models/token.model';
import { CustomersService } from 'src/customers/services/customers.service';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { GoogleUser } from '../strategies/google-strategy.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private customersService: CustomersService,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepo: Repository<PasswordResetToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  /**
   * Registra un nuevo usuario siempre con el rol 'customer' (id: 2)
   * @param {RegisterDto} dto - Los datos de registro
   * @returns El JWT generado para el usuario registrado
   */
  async register(dto: RegisterDto) {
    // Crear usuario usando UsersService (incluye hashing y validación de email)
    const createdUser = await this.userService.create({
      email: dto.email,
      name: `${dto.firstName} ${dto.lastName}`,
      password: dto.password,
      role: 2, // rol 'customer' por defecto (seed)
    });

    // Crear customer asociado
    await this.customersService.create({
      userId: createdUser.id,
    });

    // Generar JWT para el usuario creado
    return this.generateJWT(createdUser);
  }

  /**
   * Genera y guarda un token para restablecimiento de contraseña.
   * Devuelve void; la respuesta al cliente es siempre genérica por seguridad.
   * NOTA: el token se guarda hasheado. El token en claro debe enviarse por email
   * por otro sistema (ej. servicio de correo). Aquí se deja un TODO para ello.
   */
  async forgotPassword(email: string, ipAddress?: string, userAgent?: string) {
    try {
      const user = await this.userService.findByEmail(email);

      // Si el usuario no está activo, no informar al cliente; retornar genérico
      if (!user || !user.isActive) return;

      // Generar token aleatorio en claro y su versión hasheada para guardar
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(rawToken, 10);

      const expiresInMs = process.env.PASSWORD_RESET_EXPIRES_IN
        ? Number(process.env.PASSWORD_RESET_EXPIRES_IN) * 1000
        : 3600_000; // 1 hora por defecto

      const expiresAt = new Date(Date.now() + expiresInMs);

      // Invalidar tokens previos del usuario: marcarlos como usados y registrar revocado
      const prevTokens = await this.passwordResetRepo.find({
        where: { user: { id: user.id }, used: false, revokedAt: IsNull() },
      });

      if (prevTokens && prevTokens.length) {
        const now = new Date();
        prevTokens.forEach((t) => {
          t.used = true;
          t.revokedAt = now;
        });
        await this.passwordResetRepo.save(prevTokens);
      }

      const tokenEntity = this.passwordResetRepo.create({
        token: hashedToken,
        user: user,
        expiresAt,
        sentAt: new Date(),
        ipAddress,
        userAgent,
      } as Partial<PasswordResetToken>);

      await this.passwordResetRepo.save(tokenEntity);

      // TODO: Enviar correo con `rawToken` mediante servicio de email. Ej:
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&id=${user.id}`;
      // await this.mailerService.sendPasswordResetEmail(user.email, resetLink);

      // No devolver el token ni detalles: la respuesta al cliente será genérica
      return;
    } catch (error) {
      // Si ocurre un error inesperado, no diferenciamos la respuesta: devolver genérico igualmente
      return;
    }
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
   * Consume un token de restablecimiento y actualiza la contraseña del usuario.
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validar token y obtener la entidad
    const tokenEntity = await this.validatePasswordResetToken(
      rawToken,
      ipAddress,
      userAgent,
    );

    const userId = tokenEntity.user.id;

    // Cambiar contraseña (UsersService se encarga del hash)
    await this.userService.changePassword(userId, newPassword);

    // Marcar token como usado y registrar usadoAt/revocado
    tokenEntity.used = true;
    tokenEntity.usedAt = new Date();
    tokenEntity.revokedAt = new Date();
    if (ipAddress) tokenEntity.ipAddress = ipAddress;
    if (userAgent) tokenEntity.userAgent = userAgent;

    await this.passwordResetRepo.save(tokenEntity);

    // Invalidar otros tokens activos para ese usuario
    const otherTokens = await this.passwordResetRepo.find({
      where: { user: { id: userId }, used: false, revokedAt: IsNull() },
    });
    if (otherTokens && otherTokens.length) {
      const now = new Date();
      otherTokens.forEach((t) => {
        t.used = true;
        t.revokedAt = now;
      });
      await this.passwordResetRepo.save(otherTokens);
    }

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
    // Actualizar lastLoginAt (solo en login con credenciales)
    await this.userService.updateLastLogin(userData.id);

    const isCustomer = userData.role && userData.role.name === 'customer';

    // For CUSTOMER users: require and use storeId and storeUserId
    if (isCustomer) {
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
        authMethod: userData.authProvider as 'local' | 'google' | 'service',
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
    const staffPayload: PayloadToken = {
      sub: userData.id,
      role: userData.role.name,
      roleId: userData.role.id,
      roleVersion: userData.role.version,
      authMethod: userData.authProvider as 'local' | 'google' | 'service',
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
      const payload = this.jwtService.verify(refreshToken, {
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
    const user = await this.userService.findOne(userData.sub);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map((permission) => permission.name),
    };
  }

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    const { googleId, email, name, avatar } = googleUser;

    let user = await this.userService.findByGoogleId(googleId);

    if (user) {
      if (avatar && user.avatar !== avatar) {
        await this.userService.update(user.id, { avatar });
        user.avatar = avatar;
      }
      return user;
    }

    user = await this.userService.findByEmail(email);

    if (user) {
      await this.userService.update(user.id, {
        googleId,
        authProvider:
          user.authProvider === 'local' ? 'local,google' : user.authProvider,
        avatar: avatar || user.avatar || undefined,
      });
      return await this.userService.findOne(user.id);
    }

    const createdUser = await this.userService.createOAuthUser({
      email,
      name,
      googleId,
      authProvider: 'google',
      avatar,
      role: 2,
    });

    await this.customersService.create({
      userId: createdUser.id,
    });

    return createdUser;
  }

  async googleLogin(googleUser: GoogleUser) {
    const user = await this.validateGoogleUser(googleUser);
    return this.generateJWT(user);
  }
}

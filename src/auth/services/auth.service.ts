import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { UsersService } from '../../access-control/users/services/users.service';
import { User } from '../../access-control/users/entities/user.entity';
import { RegisterDto } from '../dtos/register.dto';
import { PayloadToken } from '../models/token.model';
import { CustomersService } from 'src/customers/services/customers.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private customersService: CustomersService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      return user;
    }

    return null;
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

  async generateJWT(userData: User) {
    // Actualizar lastLoginAt (solo en login con credenciales)
    await this.userService.updateLastLogin(userData.id);

    const payload: PayloadToken = {
      role: userData.role.name,
      roleId: userData.role.id,
      roleVersion: userData.role.version,
      sub: userData.id,
    };

    const access_token = await this.jwtService.sign(payload, {
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

    const response = {
      access_token,
      refresh_token,
    };

    return response;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
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
}

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      return user;
    }

    return null;
  }

  async generateJWT(userData: User) {
    const payload: PayloadToken = {
      role: userData.role.name,
      permissions: userData.role.permissions.map(
        (permission) => permission.name,
      ),
      sub: userData.id,
    };

    const access_token = await this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.sign(
      {
        sub: userData.id,
        role: userData.role.name,
      },
      {
        expiresIn: '7d',
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
        permissions: user.role.permissions.map((permission) => permission.name),
        sub: user.id,
      };

      const access_token = await this.jwtService.sign(newPayload, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        secret: process.env.JWT_ACCESS_SECRET,
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userData: User) {
    const user = await this.userService.findOne(userData.id);

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

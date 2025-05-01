import { Injectable } from '@nestjs/common';
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
      role: userData.role.id,
      permissions: userData.role.permissions.map(
        (permission) => permission.name,
      ),
      sub: userData.id,
    };

    const access_token = await this.jwtService.sign(payload);
    const { role, password, createdAt, updateAt, ...user } = userData;

    return {
      user,
      access_token,
    };
  }
}

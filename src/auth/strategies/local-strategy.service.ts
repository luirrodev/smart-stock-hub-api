import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-local';

import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategyService extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true, // ← Allow access to request object
    });
  }

  async validate(request: Request, email: string, password: string) {
    const store = (request as any).store;

    // 1. Find user by email
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Validate based on user type
    if (user.role?.name !== 'customer') {
      // STAFF user: validate password and active status
      const isValid = await this.authService.validateStaffPassword(
        user.id,
        password,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Also validate that STAFF user is active
      await this.authService.validateStaffLogin(user);
    } else {
      // CUSTOMER user: complete validation with store context
      const { storeUser } = await this.authService.validateCustomerLogin(
        user,
        password,
        store.id,
      );

      // Store storeUser in request for controller to use
      (request as any).storeUser = storeUser;
    }

    return user;
  }
}

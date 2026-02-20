import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Req,
  Get,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';

import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dtos';
import { PayloadToken } from '../models/token.model';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthV2Controller {
  constructor(private readonly authService: AuthService) {}

  /**
   * Staff User Password Reset Endpoints
   * These endpoints handle password reset for staff/admin users (non-store specific)
   */

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset for staff user',
    description: 'Initiates password reset process for a staff/admin user',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Si existe una cuenta con ese correo, se enviarán instrucciones para restablecer la contraseña. (respuesta genérica por seguridad)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'El correo electrónico no tiene un formato válido',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = (req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      '') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;

    // For staff users: storeId is undefined
    await this.authService.forgotPassword(dto.email, undefined, ip, userAgent);

    return {
      message:
        'Si existe una cuenta con ese correo, se enviarán instrucciones para restablecer la contraseña.',
    };
  }

  // configuracion de rate limiter para 3 intentos por minuto
  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset staff user password using token',
    description: 'Completes password reset for a staff/admin user',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or request',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'Token expired',
  })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = (req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      '') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;

    // For staff users: storeId is undefined
    await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      undefined,
      ip,
      userAgent,
    );

    return { message: 'Contraseña actualizada correctamente' };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get staff user profile',
    description: 'Retrieves profile information for a staff/admin user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff user profile retrieved successfully',
    schema: {
      example: {
        id: 1,
        userId: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        permissions: ['manage_users', 'manage_stores'],
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access or invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Staff user not found',
  })
  async getProfile(@GetUser() user: PayloadToken) {
    return this.authService.getProfile(user);
  }
}

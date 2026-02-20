import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';

import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GoogleUser } from '../strategies/google-strategy.service';

import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  StaffUserProfileResponseDto,
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
    type: StaffUserProfileResponseDto,
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

  /**
   * Staff User Google OAuth Endpoints (v2)
   * These endpoints handle OAuth authentication for staff/admin users
   */

  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary:
      'Autenticación con Google OAuth 2.0 para usuarios de personal (v2)',
    description:
      'Inicia el flujo de autenticación OAuth con Google para usuarios de personal.\n\n' +
      'El flujo es:\n' +
      '1. Cliente hace GET a este endpoint\n' +
      '2. Sistema redirige a Google para autenticación\n' +
      '3. Google redirige de vuelta a /auth/v2/google/callback\n' +
      '4. El callback procesa credenciales y redirige al frontend con JWT\n\n' +
      'A diferencia de v1, este flujo no requiere X-API-Key ni contexto de tienda.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirige automáticamente a la página de autenticación de Google',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Error en la autenticación con Google',
  })
  async googleAuthStaffUser() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallbackStaffUser(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    const googleUser = req.user as GoogleUser;

    try {
      // 1. Validate/create StaffUser and get User
      const user = await this.authService.validateGoogleStaffUser(googleUser);

      // 2. Generate JWT without store context
      const tokens = await this.authService.generateJWT(user);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
      const redirectUrl = `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(tokens.access_token)}&refresh_token=${encodeURIComponent(tokens.refresh_token)}`;

      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`;
      res.redirect(redirectUrl);
    }
  }
}

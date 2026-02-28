import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExcludeEndpoint,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { User } from 'src/access-control/users/entities/user.entity';

import { AuthService } from '../services/auth.service';
import { StoreUsersService } from 'src/access-control/users/services/store-users.service';

import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';

import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GoogleApiKeyGuard } from '../guards/google-api-key.guard';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';

import { GoogleUser } from '../strategies/google-strategy.service';

import { PayloadToken } from '../models/token.model';

import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ForgotPasswordStoreUserDto,
  ResetPasswordStoreUserDto,
  StoreUserProfileResponseDto,
} from '../dtos';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthV1Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly storeUsersService: StoreUsersService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(CustomApiKeyGuard, AuthGuard('local')) // ← CustomApiKeyGuard FIRST
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login - supports both STAFF and CUSTOMER users',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials with X-API-Key header',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or invalid X-API-Key',
  })
  async login(
    @GetUser() user: User,
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ) {
    const store = (request as any).store;
    const storeUser = (request as any).storeUser;

    if (user.role && user.role.name === 'customer') {
      return this.authService.generateJWT(user, store.id, storeUser.id);
    }

    return this.authService.generateJWT(user);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token para obtener un nuevo access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('register')
  @Public()
  @UseGuards(CustomApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'User registered successfully; returns access and refresh tokens',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MTYw...',
        refresh_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MjAw...',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid X-API-Key header',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Store not found',
  })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    // CustomApiKeyGuard validates the X-API-Key header and populates request.store
    // If we reach here, the store is valid and request.store is available
    const store = (request as any).store;
    return this.authService.register(registerDto, store.id);
  }

  @Post('forgot-password')
  @Public()
  @UseGuards(CustomApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset for store customer',
    description:
      'Initiates password reset process for a customer in a specific store',
  })
  @ApiBody({ type: ForgotPasswordStoreUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Si existe una cuenta con ese correo en esta tienda, se enviarán instrucciones para restablecer la contraseña. (respuesta genérica por seguridad)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'El correo electrónico o storeId no tienen un formato válido',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordStoreUserDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      '') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;
    const storeId = req.store!.id;

    await this.authService.forgotPassword(dto.email, storeId, ip, userAgent);

    return {
      message: `Se enviaran las instrucciones para restablecer la contraseña al email ${dto.email}`,
    };
  }

  // configuracion de rate limiter para 3 intentos por minuto
  @UseGuards(ThrottlerGuard)
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset store customer password using token',
    description: 'Completes password reset for a customer in a specific store',
  })
  @ApiBody({ type: ResetPasswordStoreUserDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or request',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'Token expired',
  })
  async resetPassword(
    @Body() dto: ResetPasswordStoreUserDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      '') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;

    await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      dto.storeId,
      ip,
      userAgent,
    );

    return { message: 'Contraseña actualizada correctamente' };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get customer profile in store',
    description:
      'Retrieves detailed profile information for a customer in a specific store context, including purchase statistics and active cart',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer profile retrieved successfully with statistics',
    type: StoreUserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access, invalid token, or invalid X-API-Key',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer profile not found',
  })
  async getProfile(@GetUser() user: PayloadToken) {
    return this.authService.getProfile(user);
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleApiKeyGuard, GoogleAuthGuard)
  @ApiQuery({
    name: 'apiKey',
    required: true,
    description:
      'Clave API de la tienda para iniciar el flujo de autenticación con Google. Ejemplo: `?apiKey=tu-clave-api-aqui`',
  })
  @ApiOperation({
    summary:
      'Inicia autenticación con Google OAuth 2.0 para clientes de tienda',
    description:
      'Redirige al usuario a Google para autenticación. Después, el sistema redirige a:\n\n' +
      '**✅ Éxito**: `{FRONTEND_URL}/auth/google/callback?access_token={token}&refresh_token={refresh_token}`\n\n' +
      '**❌ Errores**: `{FRONTEND_URL}/auth/google/callback?error={mensaje}`\n\n' +
      'El parámetro `apiKey` debe venir en la URL. El `storeId` se maneja automáticamente mediante OAuth state. El frontend solo debe manejar los tokens en el callback.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirige a Google. Después del login, te envía al callback con tokens o error.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'API Key inválido o ausente. Redirige a: `{FRONTEND_URL}/auth/google/callback?error={mensaje}`',
  })
  async googleAuthStoreUser() {
    // GoogleApiKeyGuard validates apiKey and populates request.store
    // GoogleAuthGuard encodes storeId in state parameter and redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallbackStoreUser(
    @Req() req: any,
    @Res({ passthrough: false }) res: Response,
  ) {
    const googleUser = req.user as GoogleUser;

    try {
      // Retrieve storeId from state parameter
      let storeId: number | undefined;

      if (googleUser.state) {
        const decoded = JSON.parse(
          Buffer.from(googleUser.state, 'base64').toString('utf-8'),
        );
        storeId = decoded.storeId;
      }

      if (!storeId) {
        const frontendUrl = process.env.FRONTEND_URL;
        const redirectUrl = `${frontendUrl}/auth/google/callback?error=missing_store_id`;
        return res.redirect(redirectUrl);
      }

      // 1. Validate/create StoreUser and get User
      const user = await this.authService.validateGoogleStoreUser(
        googleUser,
        storeId,
      );

      if (!user.customerId) {
        throw new Error('User does not have customerId');
      }

      // 2. Create or update StoreUser with Google credentials
      const storeUser =
        await this.storeUsersService.createOrUpdateGoogleCredentials(
          storeId,
          user.customerId,
          googleUser.googleId,
        );

      // 3. Generate JWT with store context
      const tokens = await this.authService.generateJWT(
        user,
        storeId,
        storeUser.id,
      );

      const frontendUrl = process.env.FRONTEND_URL;
      const redirectUrl = `${frontendUrl}/auth/google/callback?access_token=${encodeURIComponent(tokens.access_token)}&refresh_token=${encodeURIComponent(tokens.refresh_token)}`;

      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const redirectUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`;
      res.redirect(redirectUrl);
    }
  }
}

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
  Inject,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { User } from 'src/access-control/users/entities/user.entity';

import { AuthService } from '../services/auth.service';
import { StoreUsersService } from 'src/access-control/users/services/store-users.service';

import { GetUser } from '../decorators/get-user.decorator';
import { Public } from '../decorators/public.decorator';

import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';

import { GoogleUser } from '../strategies/google-strategy.service';

import { PayloadToken } from '../models/token.model';

import { GOOGLE_AUTH_FLOW_DOCUMENTATION } from '../documentation/google-auth-flow.documentation';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
  @UseGuards(CustomApiKeyGuard, GoogleAuthGuard)
  @ApiOperation({
    summary: 'Autenticación con Google OAuth 2.0 para clientes de tienda (v1)',
    description:
      'Inicia el flujo de autenticación OAuth con Google. Requiere header X-API-Key para identificar la tienda.\n\n' +
      'El flujo es:\n' +
      '1. Cliente hace GET a este endpoint con X-API-Key header\n' +
      '2. Sistema redirige a Google para autenticación\n' +
      '3. Google redirige de vuelta a /auth/v1/google/callback\n' +
      '4. El callback procesa credenciales y redirige al frontend con JWT\n\n' +
      'Nota: La tienda se obtiene del X-API-Key header por CustomApiKeyGuard\n' +
      '(En desarrollo, también se puede usar query param ?storeId=1 para testing)',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirige automáticamente a la página de autenticación de Google',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Error: X-API-Key header inválido o ausente',
  })
  async googleAuthStoreUser(
    @Req() request: any,
    @Query('storeId') queryStoreId?: string,
  ) {
    // Store context is populated by CustomApiKeyGuard
    const store = request.store;
    const clientIp =
      request.ip || request.connection.remoteAddress || 'unknown';

    // Determine storeId to use:
    // - Primary: from store context (validated by CustomApiKeyGuard)
    // - Fallback (dev only): from query parameter for testing
    let storeIdToUse = store?.id;

    if (!storeIdToUse && queryStoreId && process.env.NODE_ENV !== 'prod') {
      storeIdToUse = Number(queryStoreId);
    }

    // Store storeId in Redis using client IP as key (expires after 10 minutes)
    if (storeIdToUse) {
      const cacheKey = `google_oauth_store:${clientIp}`;
      await this.cacheManager.set(cacheKey, storeIdToUse, 10 * 60 * 1000); // 10 minutes TTL
    }
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
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      // Retrieve storeId from Redis
      const cacheKey = `google_oauth_store:${clientIp}`;
      const storeId = (await this.cacheManager.get(cacheKey)) as
        | number
        | undefined;

      // Clean up immediately after retrieval
      await this.cacheManager.del(cacheKey);

      if (!storeId) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
        const redirectUrl = `${frontendUrl}/auth/callback?error=missing_store_id`;
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

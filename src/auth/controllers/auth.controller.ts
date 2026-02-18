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
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { User } from 'src/access-control/users/entities/user.entity';
import { GetUser } from '../decorators/get-user.decorator';
import { LoginDto, RefreshTokenDto } from '../dtos/auth.dto';
import { RegisterDto } from '../dtos/register.dto';
import { JWTAuthGuard } from '../guards/jwt-auth.guard';
import { PayloadToken } from '../models/token.model';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { Public } from '../decorators/public.decorator';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GoogleUser } from '../strategies/google-strategy.service';
import { GOOGLE_AUTH_FLOW_DOCUMENTATION } from '../documentation/google-auth-flow.documentation';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(AuthGuard('local'), CustomApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login - supports both STAFF and CUSTOMER users',
  })
  @ApiBody({
    type: LoginDto,
    description:
      'User credentials. For CUSTOMER users, X-API-Key header is required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or missing X-API-Key for customer',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'X-API-Key is required for customer login',
  })
  async login(
    @GetUser() user: User,
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ) {
    // Handle CUSTOMER login
    if (user.role && user.role.name === 'customer') {
      const storeId = (request as any).store?.id;
      const { storeUser } = await this.authService.validateCustomerLogin(
        user,
        loginDto.password,
        storeId,
      );
      return this.authService.generateJWT(user, storeId, storeUser.id);
    }

    // Handle STAFF login
    await this.authService.validateStaffLogin(user);
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
    const storeId = (request as any).store.id;
    return this.authService.register(registerDto, storeId);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
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

    await this.authService.forgotPassword(dto.email, ip, userAgent);

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
  @ApiOperation({ summary: 'Reset user password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or request',
  })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = (req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      '') as string;
    const userAgent = (req.headers['user-agent'] || '') as string;

    await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      ip,
      userAgent,
    );

    return { message: 'Contraseña actualizada correctamente' };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access or invalid token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getProfile(@GetUser() user: PayloadToken) {
    return this.authService.getProfile(user);
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Autenticación con Google OAuth 2.0',
    description: GOOGLE_AUTH_FLOW_DOCUMENTATION,
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
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    const googleUser = req.user as GoogleUser;
    const tokens = await this.authService.googleLogin(googleUser);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3010';
    const redirectUrl = `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(tokens.access_token)}&refresh_token=${encodeURIComponent(tokens.refresh_token)}`;

    res.redirect(redirectUrl);
  }
}

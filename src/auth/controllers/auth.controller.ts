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
import { StoreUsersService } from 'src/access-control/users/services/store-users.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storeUsersService: StoreUsersService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login - supports both STAFF and CUSTOMER users',
  })
  @ApiBody({
    type: LoginDto,
    description:
      'User credentials. For CUSTOMER users, storeId is required in body or header.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing storeId for customer login',
  })
  async login(
    @GetUser() user: User,
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ) {
    // Check if user is a CUSTOMER
    if (user.role && user.role.name === 'customer') {
      // For CUSTOMER login, storeId is required
      // Can come from request body or X-Store-ID header
      let storeId = loginDto['storeId'] as number | undefined;
      if (!storeId) {
        storeId = request.headers['x-store-id']
          ? parseInt(request.headers['x-store-id'] as string, 10)
          : undefined;
      }

      if (!storeId || isNaN(storeId)) {
        throw new BadRequestException(
          'storeId is required for customer login (provide in body or X-Store-ID header)',
        );
      }

      // Find the StoreUser record for this customer-store pair
      if (!user.customerId) {
        throw new BadRequestException('Customer ID is missing');
      }
      const storeUsers = await this.storeUsersService.findStoresForCustomer(
        user.customerId,
      );
      const storeUser = storeUsers.find((su) => su.storeId === storeId);

      if (!storeUser) {
        throw new BadRequestException(
          `Customer is not registered for store ${storeId}`,
        );
      }

      // Generate CUSTOMER token with store context
      return this.authService.generateJWT(user, storeId, storeUser.id);
    }

    // For STAFF users, generate token without store context
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
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing or invalid X-Store-ID header',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Store not found',
  })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    // Read X-Store-ID from header (required)
    const storeIdHeader = request.headers['x-store-id'];
    if (!storeIdHeader) {
      throw new BadRequestException(
        'X-Store-ID header is required for customer registration',
      );
    }

    const storeId = parseInt(storeIdHeader as string, 10);
    if (isNaN(storeId)) {
      throw new BadRequestException('X-Store-ID must be a valid number');
    }

    // Pass storeId to the auth service
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

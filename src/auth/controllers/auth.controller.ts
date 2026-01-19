import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { User } from 'src/access-control/users/entities/user.entity';
import { GetUser } from '../decorators/get-user.decorator';
import { LoginDto, RefreshTokenDto } from '../dtos/auth.dto';
import { JWTAuthGuard } from '../guards/jwt-auth.guard';
import { PayloadToken } from '../models/token.model';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciales de usuario para el login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  login(@GetUser() user: User, @Body() loginDto: LoginDto) {
    return this.authService.generateJWT(user);
  }

  @Post('refresh')
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

  @Get('profile')
  @UseGuards(JWTAuthGuard)
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
}

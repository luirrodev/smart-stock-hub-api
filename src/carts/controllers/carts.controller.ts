import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { CartService } from '../services/carts.service';
import { plainToInstance } from 'class-transformer';
import { CartResponseDto } from '../dtos/cart-response.dto';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartService) {}

  // @Get()
  // @ApiOperation({ summary: 'Obtener todos los carritos (mínimo para pruebas)' })
  // @ApiOkResponse({ description: 'Lista de carritos' })
  // async getAll() {
  //   return await this.cartsService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Obtener un carrito por id' })
  // @ApiOkResponse({ description: 'Carrito encontrado' })
  // async getOne(@Param('id') id: string): Promise<Cart> {
  //   return await this.cartsService.getCart(id);
  // }

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: 'Obtener carrito activo del usuario o invitado' })
  @ApiOkResponse({
    description: 'Carrito activo (si existe)',
    type: CartResponseDto,
  })
  async getActiveCart(
    @Query('sessionId') sessionId?: string,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto | null> {
    const userId = user?.sub ?? null;
    const cart = await this.cartsService.getCart(userId, sessionId ?? null);
    return cart
      ? plainToInstance(CartResponseDto, cart, {
          excludeExtraneousValues: true,
        })
      : null;
  }

  @Post()
  @OptionalAuth()
  @ApiOperation({ summary: 'Añadir un producto al carrito' })
  @ApiCreatedResponse({
    description: 'Carrito actualizado',
    type: CartResponseDto,
  })
  async addToCart(
    @Body() dto: AddToCartDto,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto> {
    // Si el request viene autenticado, usamos el user.sub sobre el body
    const payload: AddToCartDto = {
      ...dto,
      userId: user?.sub ?? null,
    };

    const cart = await this.cartsService.addToCart(payload);
    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import { CartService } from '../services/carts.service';
import { plainToInstance } from 'class-transformer';
import { CartResponseDto } from '../dtos/cart-response.dto';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { GetActiveCartDto } from '../dtos/get-active-cart.dto';
import { UpdateCartItemQuantityDto } from '../dtos/update-cart-item-quantity.dto';
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
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Obtener carrito activo del usuario o invitado' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string.',
  })
  @ApiOkResponse({
    description: 'Carrito activo (si existe)',
    type: CartResponseDto,
  })
  async getActiveCart(
    @Query() query: GetActiveCartDto,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto | null> {
    const userId = user?.sub ?? null;
    const cart = await this.cartsService.getCart(
      userId,
      query.sessionId ?? null,
    );
    return cart
      ? plainToInstance(CartResponseDto, cart, {
          excludeExtraneousValues: true,
        })
      : null;
  }

  @Post()
  @OptionalAuth()
  @ApiOperation({ summary: 'Añadir un producto al carrito' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string. Si se omite, el backend lo generará y lo devolverá en el cuerpo de la respuesta; el frontend debe almacenarlo y reenviarlo en futuras peticiones para mantener el mismo carrito.',
  })
  @ApiCreatedResponse({
    description:
      'Carrito actualizado. Si la petición es de invitado y no incluye `sessionId` en la query, el backend generará un `sessionId` (UUID) y lo devolverá en el cuerpo de la respuesta en el campo `sessionId`. El frontend es responsable de guardarlo y enviarlo en futuras solicitudes.',
    type: CartResponseDto,
    schema: {
      example: {
        id: 'a3f8e9d2-...',
        sessionId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        items: [],
        totalItems: 0,
        subtotal: 0,
      },
    },
  })
  async addToCart(
    @Body() dto: AddToCartDto,
    @Query() query: GetActiveCartDto,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto> {
    // Si el request viene autenticado, usamos el user.sub sobre el body y la query
    const payload: AddToCartDto = {
      ...dto,
      userId: user?.sub ?? null,
      sessionId: query.sessionId ?? null,
    };

    const cart = await this.cartsService.addToCart(payload);
    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('items/:itemId/quantity')
  @OptionalAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Actualizar cantidad de un item del carrito' })
  @ApiParam({
    name: 'itemId',
    required: true,
    description: 'ID del item a actualizar',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string.',
  })
  @ApiOkResponse({ description: 'Carrito actualizado', type: CartResponseDto })
  async updateCartItemQuantity(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemQuantityDto,
    @Query() query: GetActiveCartDto,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto> {
    const userId = user?.sub ?? null;
    const session = query.sessionId ?? null;
    const cart = await this.cartsService.updateCartItemQuantity(
      itemId,
      dto.quantity,
      userId,
      session,
    );

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('items/:itemId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Eliminar un item del carrito' })
  @ApiParam({
    name: 'itemId',
    required: true,
    description: 'ID del item a eliminar',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string.',
  })
  @ApiNoContentResponse({ description: 'Item eliminado correctamente' })
  @HttpCode(204)
  async removeCartItem(
    @Param('itemId') itemId: string,
    @Query('sessionId') sessionId?: string,
    @GetUser() user?: PayloadToken,
  ): Promise<void> {
    const userId = user?.sub ?? null;
    await this.cartsService.removeCartItem(itemId, userId, sessionId ?? null);
  }
}

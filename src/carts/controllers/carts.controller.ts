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
  UseGuards,
  BadRequestException,
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
import {
  AddToCartDto,
  CartQueryDto,
  UpdateCartItemQuantityDto,
  ItemParamDto,
} from '../dtos';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Carts')
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
    @Query() query: CartQueryDto,
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
    @Query() query: CartQueryDto,
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
    @Param() params: ItemParamDto,
    @Body() dto: UpdateCartItemQuantityDto,
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
  ): Promise<CartResponseDto> {
    const userId = user?.sub ?? null;
    const session = query.sessionId ?? null;
    const cart = await this.cartsService.updateCartItemQuantity(
      params.itemId,
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
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
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
    @Param() params: ItemParamDto,
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
  ): Promise<void> {
    const userId = user?.sub ?? null;
    await this.cartsService.removeCartItem(
      params.itemId,
      userId,
      query.sessionId ?? null,
    );
  }

  @Delete()
  @OptionalAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Vaciar el carrito del usuario o invitado' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string.',
  })
  @ApiNoContentResponse({ description: 'Carrito vaciado correctamente' })
  @HttpCode(204)
  async clearCart(
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
  ): Promise<void> {
    const userId = user?.sub ?? null;
    await this.cartsService.clearCart(userId, query.sessionId ?? null);
  }

  @Post('merge')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary:
      'Fusionar carrito de invitado con el carrito del usuario (se usa en login)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    description:
      'ID de sesión del carrito de invitado (UUID). Debe viajar en query string.',
  })
  @ApiOkResponse({ description: 'Carrito fusionado', type: CartResponseDto })
  async mergeGuestCart(
    @Query() query: CartQueryDto,
    @GetUser() user: PayloadToken,
  ): Promise<CartResponseDto> {
    const userId = user.sub;
    const sessionId = query.sessionId ?? null;

    if (!sessionId) {
      throw new BadRequestException(
        'sessionId es requerido para fusionar carritos',
      );
    }

    const cart = await this.cartsService.mergeGuestCartWithUserCart(
      userId,
      sessionId,
    );

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }
}

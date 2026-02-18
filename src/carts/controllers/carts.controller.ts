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
  Req,
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
import { Request } from 'express';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartService) {}

  @Get()
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({ summary: 'Obtener carrito activo del cliente o invitado' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para clientes invitados (UUID). Debe viajar en query string.',
  })
  @ApiOkResponse({
    description: 'Carrito activo (si existe)',
    type: CartResponseDto,
  })
  async getActiveCart(
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ): Promise<CartResponseDto> {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    const cart = await this.cartsService.getCart(
      storeId,
      storeUserId,
      query.sessionId ?? null,
    );
    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({ summary: 'Añadir un producto al carrito' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para clientes invitados (UUID). Debe viajar en query string. Si se omite, el backend lo generará y lo devolverá en el cuerpo de la respuesta; el frontend debe almacenarlo y reenviarlo en futuras peticiones para mantener el mismo carrito.',
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
    @Req() request?: Request,
  ): Promise<CartResponseDto> {
    // CustomApiKeyGuard garantiza que request.store está present
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    const sessionId = query.sessionId ?? null;

    const cart = await this.cartsService.addToCart({
      productId: dto.productId,
      quantity: dto.quantity,
      storeId,
      storeUserId,
      sessionId,
    });

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
      'ID de sesión para clientes invitados (UUID). Debe viajar en query string.',
  })
  @ApiOkResponse({ description: 'Carrito actualizado', type: CartResponseDto })
  async updateCartItemQuantity(
    @Param() params: ItemParamDto,
    @Body() dto: UpdateCartItemQuantityDto,
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ): Promise<CartResponseDto> {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    const session = query.sessionId ?? null;
    const cart = await this.cartsService.updateCartItemQuantity(
      params.itemId,
      dto.quantity,
      storeId,
      storeUserId,
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
      'ID de sesión para clientes invitados (UUID). Debe viajar en query string.',
  })
  @ApiNoContentResponse({ description: 'Item eliminado correctamente' })
  @HttpCode(204)
  async removeCartItem(
    @Param() params: ItemParamDto,
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ): Promise<void> {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    await this.cartsService.removeCartItem(
      params.itemId,
      storeId,
      storeUserId,
      query.sessionId ?? null,
    );
  }

  @Delete()
  @OptionalAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Vaciar el carrito del cliente o invitado' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'ID de sesión para clientes invitados (UUID). Debe viajar en query string.',
  })
  @ApiNoContentResponse({ description: 'Carrito vaciado correctamente' })
  @HttpCode(204)
  async clearCart(
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ): Promise<void> {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    await this.cartsService.clearCart(
      storeId,
      storeUserId,
      query.sessionId ?? null,
    );
  }

  @Post('merge')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary:
      'Fusionar carrito de invitado con el carrito del cliente (se usa en login)',
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
    @Req() request?: Request,
  ): Promise<CartResponseDto> {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId;
    const sessionId = query.sessionId ?? null;

    if (!sessionId) {
      throw new BadRequestException(
        'sessionId es requerido para fusionar carritos',
      );
    }

    if (!storeUserId) {
      throw new BadRequestException(
        'storeUserId es requerido para fusionar carritos',
      );
    }

    const cart = await this.cartsService.mergeGuestCartWithUserCart(
      storeId,
      storeUserId,
      sessionId,
    );

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }
}

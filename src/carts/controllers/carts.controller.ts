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
  ApiHeader,
  ApiSecurity,
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
@Controller({
  path: 'carts',
  version: '1',
})
export class CartsV1Controller {
  constructor(private readonly cartsService: CartService) {}

  @Get()
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener carrito activo',
    description: `Retorna el carrito activo del usuario autenticado o del invitado.

**Autenticado (usuario CUSTOMER):** Retorna el carrito asociado al usuario en esa tienda
**Invitado:** Retorna el carrito asociado al sessionId en esa tienda

**Requiere:** Header \`x-api-key\` con la API Key de la tienda`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (opcional)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Carrito activo encontrado',
    type: CartResponseDto,
  })
  async getActiveCart(
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ) {
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;

    return await this.cartsService.getCart(
      storeId,
      storeUserId,
      query.sessionId ?? null,
    );
  }

  @Post()
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Agregar producto al carrito',
    description: `Agrega un producto al carrito activo (autenticado o invitado).

**Para invitados sin sessionId:**
- El backend genera automáticamente un UUID de sesión
- El cliente DEBE guardar este \`sessionId\` de la respuesta
- Usar este \`sessionId\` en futuras solicitudes para mantener el mismo carrito

**Para invitados con sessionId:**
- Agrega el producto al carrito asociado a ese sessionId

**Para usuarios autenticados:**
- Agrega el producto al carrito del usuario en esa tienda

**Requiere:** Header \`x-api-key\` con la API Key de la tienda`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (opcional)',
    required: false,
  })
  @ApiCreatedResponse({
    description:
      'Producto agregado al carrito exitosamente. Si fue un invitado sin sessionId, asegúrate de guardar el sessionId de la respuesta para futuras solicitudes.',
    type: CartResponseDto,
  })
  async addToCart(
    @Body() dto: AddToCartDto,
    @Query() query: CartQueryDto,
    @GetUser() user?: PayloadToken,
    @Req() request?: Request,
  ) {
    // CustomApiKeyGuard garantiza que request.store está present
    const storeId = request!.store!.id;
    const storeUserId = user?.storeUserId ?? null;
    const sessionId = query.sessionId ?? null;

    return await this.cartsService.addToCart({
      productStoreId: dto.productId,
      quantity: dto.quantity,
      storeId,
      storeUserId,
      sessionId,
    });
  }

  @Patch('items/:itemId/quantity')
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Actualizar cantidad de un item del carrito',
    description: `Actualiza la cantidad de un producto en el carrito.

**Requiere:** Header \`x-api-key\` con la API Key de la tienda

**Validaciones:**
- El item debe pertenecer al carrito del usuario/invitado en esa tienda
- La cantidad debe ser un número entero positivo
- Si la cantidad es 0, el item se puede eliminar (usar DELETE en su lugar)`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (opcional)',
    required: false,
  })
  @ApiParam({
    name: 'itemId',
    type: 'string',
    description: 'UUID del item del carrito a actualizar',
  })
  @ApiOkResponse({
    description: 'Cantidad del item actualizada exitosamente',
    type: CartResponseDto,
  })
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
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Eliminar un item del carrito',
    description: `Elimina un producto del carrito (soft delete).

**Requiere:** Header \`x-api-key\` con la API Key de la tienda

**Nota:** El item se marca como eliminado (soft delete), no se borra completamente de la BD`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (opcional)',
    required: false,
  })
  @ApiParam({
    name: 'itemId',
    type: 'string',
    description: 'UUID del item del carrito a eliminar',
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
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Vaciar carrito',
    description: `Elimina todos los items del carrito (soft delete).

**Requiere:** Header \`x-api-key\` con la API Key de la tienda

**Nota:** Los items se marcan como eliminados (soft delete), no se borran completamente de la BD`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (opcional)',
    required: false,
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
  @UseGuards(JWTAuthGuard, CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Fusionar carrito de invitado con carrito de usuario autenticado',
    description: `Fusiona el carrito de invitado (identificado por sessionId) con el carrito del usuario autenticado en esa tienda.

**Caso de uso:**
Un invitado agrega productos al carrito con un sessionId. Después se autentica/registra. Este endpoint transfiere todos los productos del carrito de invitado al carrito del usuario autenticado.

**Requiere:**
- Header \`x-api-key\` con la API Key de la tienda
- Header \`Authorization\` con Bearer token JWT (usuario DEBE estar autenticado como CUSTOMER)
- Query parameter \`sessionId\` con el UUID del carrito de invitado

**Flujo recomendado:**
1. Invitado agrega productos → Backend genera sessionId automático
2. Invitado se autentica POST /auth/login
3. Frontend llama POST /carts/merge?sessionId=<sessionId anterior>
4. Backend fusiona ambos carritos
5. Frontend usa el carrito del usuario desde ahora`,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key de la tienda (requerido)',
    required: true,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token JWT (requerido)',
    required: true,
  })
  @ApiSecurity('bearer')
  @ApiOkResponse({
    description:
      'Carrito fusionado exitosamente. Contiene todos los items de ambos carritos.',
    type: CartResponseDto,
  })
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

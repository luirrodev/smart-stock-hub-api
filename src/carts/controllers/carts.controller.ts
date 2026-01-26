import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { CartService } from '../services/carts.service';
import { Cart } from '../entities/cart.entity';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/access-control/users/entities/user.entity';
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
  // async getOne(@Param('id', ParseIntPipe) id: number): Promise<Cart> {
  //   return await this.cartsService.findOne(id);
  // }

  @Post()
  @OptionalAuth()
  @ApiOperation({ summary: 'Añadir un producto al carrito' })
  @ApiCreatedResponse({ description: 'Carrito actualizado', type: Cart })
  async addToCart(
    @Body() dto: AddToCartDto,
    @GetUser() user?: PayloadToken,
  ): Promise<Cart> {
    // Si el request viene autenticado, usamos el user.sub sobre el body
    const payload: AddToCartDto = {
      ...dto,
      userId: user?.sub ?? null,
    };

    return await this.cartsService.addToCart(payload);
  }
}

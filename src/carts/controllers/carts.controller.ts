import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

import { CartsService } from '../services/carts.service';
import { Cart } from '../entities/cart.entity';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los carritos (mínimo para pruebas)' })
  @ApiOkResponse({ description: 'Lista de carritos' })
  async getAll(): Promise<Cart[]> {
    return await this.cartsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un carrito por id' })
  @ApiOkResponse({ description: 'Carrito encontrado' })
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<Cart> {
    return await this.cartsService.findOne(id);
  }
}

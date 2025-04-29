import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import {
  CreateOrderProductDTO,
  UpdateOrderProductDto,
} from '../dtos/order-product.dto';
import { OrderProductService } from '../services/order-product.service';

@Controller('order-item')
export class OrderProductController {
  constructor(private itemService: OrderProductService) {}

  @Post()
  create(@Body() payload: CreateOrderProductDTO) {
    return this.itemService.create(payload);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateOrderProductDto,
  ) {
    return this.itemService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.remove(id);
  }
}

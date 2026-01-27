import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from '../dtos/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  @ApiCreatedResponse({
    description: 'Pedido creado correctamente',
    type: OrderResponseDto,
  })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @GetUser() user: PayloadToken,
  ) {
    // Si está autenticado, preferimos el userId del token
    const payload: CreateOrderDto = {
      ...dto,
      userId: user.sub,
    };

    const order = await this.ordersService.createOrder(payload);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido por id' })
  @ApiParam({ name: 'id', required: true, description: 'ID del pedido' })
  @ApiOkResponse({ description: 'Pedido encontrado', type: OrderResponseDto })
  async getOrder(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: PayloadToken,
  ) {
    const order = await this.ordersService.findOne(id, user);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }
}

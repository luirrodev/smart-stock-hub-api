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
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import {
  CreateOrderDto,
  CreateShippingOrderDto,
  CreatePickupOrderDto,
} from '../dtos/create-order.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { ValidateOrderDtoPipe } from '../pipes/validate-order-dto.pipe';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo pedido',
    description:
      'Crea un nuevo pedido para el usuario autenticado. Soporta dos tipos de cumplimiento: SHIPPING (envío a domicilio) o PICKUP (retiro en punto). La tienda se obtiene automáticamente del contexto del usuario (token), asegurando multitienda segura sin necesidad de especificar storeId en el body.',
  })
  @ApiBody({
    type: CreateShippingOrderDto,
    description:
      'Datos para crear un nuevo pedido. Proporciona ambos esquemas: CreateShippingOrderDto (para envíos) o CreatePickupOrderDto (para retiros). Nota: storeId se obtiene del token del usuario autenticado.',
    examples: {
      shipping: {
        summary: 'Orden con envío a domicilio (SHIPPING)',
        value: {
          fulfillmentType: 'shipping',
          shippingProvince: 'Buenos Aires',
          shippingMunicipality: 'La Plata',
          shippingFirstName: 'Juan',
          shippingLastName: 'Pérez',
          shippingStreet: 'Avenida Siempreviva',
          shippingNumber: '123',
          shippingApartment: '4B',
          items: [
            {
              productId: 1,
              quantity: 2,
            },
          ],
          tax: 10.5,
          shippingCost: 50,
        },
      },
      pickup: {
        summary: 'Orden para retiro en punto (PICKUP)',
        value: {
          fulfillmentType: 'pickup',
          pickupPointId: 5,
          items: [
            {
              productId: 1,
              quantity: 2,
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Pedido creado correctamente',
    type: OrderResponseDto,
  })
  async createOrder(
    @Body(new ValidateOrderDtoPipe()) dto: CreateOrderDto,
    @GetUser() user: PayloadToken,
  ) {
    const order = await this.ordersService.createOrder(dto, user);
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

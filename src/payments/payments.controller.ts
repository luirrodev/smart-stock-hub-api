import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Configurar PayPal para una tienda
  @Post('stores/:storeId/payment-config')
  // @HttpCode(204)
  async createStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreatePaymentConfigDto,
  ) {
    // Endpoint placeholder: no retorna nada por ahora
    await this.paymentsService.createStorePaymentConfig(storeId, dto);

    return {
      message: 'Configuración de pago creada',
    };
  }

  // Ver configuración de pagos de una tienda
  @Get('stores/:storeId/payment-config')
  @HttpCode(204)
  async getStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<void> {
    // Endpoint placeholder: no retorna nada por ahora
    return void 0;
  }

  // Actualizar configuración de pagos
  @Put('stores/:storeId/payment-config/:id')
  @HttpCode(204)
  async updateStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentConfigDto,
  ): Promise<void> {
    // Endpoint placeholder: no retorna nada por ahora
    // await this.paymentsService.updateStorePaymentConfig(storeId, id, dto);
    return void 0;
  }

  /**
   * Crear orden de pago
   * POST /payments/create
   */
  @Post('create')
  @ApiOperation({ summary: 'Crear orden de pago' })
  @ApiCreatedResponse({ description: 'Orden creada correctamente' })
  @ApiBody({ type: CreatePaymentDto })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @GetUser() user?: PayloadToken,
  ) {
    return await this.paymentsService.initiatePayment(dto.orderId, user);
  }

  /**
   * Captura un pago aprobado
   * POST /payments/capture
   */
  @Post('capture')
  @ApiOperation({ summary: 'Capturar pago aprobado' })
  @ApiOkResponse({ description: 'Pago capturado correctamente' })
  async capturePayment(
    @Body('paypalOrderId') paypalOrderId: string,
    @GetUser() user?: PayloadToken,
  ) {
    return await this.paymentsService.capturePayment(paypalOrderId, user);
  }

  /**
   * Consulta estado de un pago
   * GET /payments/:id/status
   */
  @Get(':id/status')
  @ApiOperation({ summary: 'Obtener estado de un pago' })
  @ApiParam({ name: 'id', required: true, description: 'ID del pago' })
  @ApiOkResponse({ description: 'Estado del pago obtenido' })
  async getPaymentStatus(
    @Param('id') paymentId: string,
    @GetUser() user?: PayloadToken,
  ) {
    return await this.paymentsService.getPaymentStatus(paymentId);
  }

  // Procesar reembolso de un pago
  @Post(':paymentId/refund')
  @ApiOperation({ summary: 'Procesar reembolso (total o parcial)' })
  @ApiParam({ name: 'paymentId', required: true, description: 'ID del pago' })
  async refundPayment(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: RefundPaymentDto,
  ) {
    return await this.paymentsService.refundPayment(paymentId, dto);
  }
}

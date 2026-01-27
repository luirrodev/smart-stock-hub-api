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
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller('admin')
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
    await this.paymentsService.getStorePaymentConfig(storeId);
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
    await this.paymentsService.updateStorePaymentConfig(storeId, id, dto);
  }

  // Procesar reembolso de un pago
  @Post('payments/:paymentId/refund')
  @HttpCode(204)
  async refundPayment(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: RefundPaymentDto,
  ): Promise<void> {
    // Endpoint placeholder: no retorna nada por ahora
    await this.paymentsService.refundPayment(paymentId, dto);
  }
}

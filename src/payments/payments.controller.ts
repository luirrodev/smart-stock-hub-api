import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { PaymentsService } from './payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { PaymentProvider } from '../stores/entities/store-payment-config.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  /**
   * Crear una orden de pago para una tienda.
   * El proceso de pago se inicia creando una orden en PayPal o Stripe
   * dependiendo de la configuración de la tienda.
   *
   * @param CreatePaymentDto - Datos de la orden de pago
   * @param user - Usuario Autenticado
   * @returns URL de aprobación de PayPal y datos del pago
   */
  @Post('checkout')
  @ApiOperation({ summary: 'Crear orden de pago' })
  @ApiBody({ type: CreatePaymentDto })
  async createPayment(
    @Body() payload: CreatePaymentDto,
    @GetUser() user: PayloadToken,
  ) {
    return await this.paymentsService.initiatePayment(payload, user);
  }

  /**
   * Captura un pago aprobado por el cliente
   * @param dto - Datos del pago a capturar
   * @returns Pago capturado correctamente
   */
  @Post('capture')
  @ApiExcludeEndpoint()
  async capturePayment(@Body() dto: CapturePaymentDto) {
    return await this.paymentsService.capturePayment(
      dto.providerOrderId,
      dto.provider,
    );
  }

  // ToDo: Implementar reembolso de pagos
  // @Post('/refund/:paymentId')
  // @ApiOperation({ summary: 'Procesar reembolso (total o parcial)' })
  // @ApiParam({ name: 'paymentId', required: true, description: 'ID del pago' })
  // async refundPayment(
  //   @Param('paymentId', ParseIntPipe) paymentId: number,
  //   @Body() dto: RefundPaymentDto,
  // ) {
  //   return await this.paymentsService.refundPayment(paymentId, dto);
  // }

  @Get('success')
  @OptionalAuth()
  @ApiExcludeEndpoint()
  async paymentSuccess(
    @Query('token') token: string,
    @Query('provider') provider: string,
    @Query('PayerID') payerId?: string,
  ) {
    try {
      const result = await this.paymentsService.capturePayment(
        String(token),
        // Forzar Paypal para pruebas
        PaymentProvider.PAYPAL,
      );
      return { message: 'Pago capturado', result };
    } catch (err) {
      // Retornar un respuesta simple para el frontend; el servicio ya lanza excepciones apropiadas
      return {
        message: 'Error al capturar el pago',
        error: err?.message || err,
      };
    }
  }
}

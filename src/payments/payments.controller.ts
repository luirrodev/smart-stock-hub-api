import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { CreatePaymentResponseDto } from './dto/create-payment-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiExcludeEndpoint,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
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
  @ApiOperation({
    summary: 'Crear orden de pago',
    description:
      'Inicia el proceso de pago para una orden. Devuelve la URL de aprobación del proveedor y datos del pago. ' +
      'El frontend debe redirigir al cliente a `approvalUrl` para completar el pago.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Posibles causas:\n' +
      '- La orden no está en estado pendiente de pago.\n' +
      '- Ya existe un pago en proceso para la orden.',
    schema: {
      example: {
        statusCode: 400,
        message: 'La orden en cuestión no está en estado: Pendiente de Pago',
        error: 'Bad Request',
      },
    },
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Orden de pago creada correctamente',
    type: CreatePaymentResponseDto,
  })
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
  async capturePayment(
    @Body() dto: CapturePaymentDto,
    @Query('sig') sig: string,
  ) {
    // Redirigido aquí tras la aprobación del pago por el cliente
    await this.paymentsService.capturePayment(
      dto.providerOrderId,
      dto.provider,
      sig,
    );
    // Todo: Redirigir al cliente hacia el frontend después de capturar el pago
    return { message: 'Pago capturado correctamente' };
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
    @Query('sig') sig: string,
    @Query('provider') provider: string,
    @Query('PayerID') payerId?: string,
  ) {
    const result = await this.paymentsService.capturePayment(
      String(token),
      provider as PaymentProvider,
      sig,
    );
    return { message: 'Pago capturado', result };
  }
}

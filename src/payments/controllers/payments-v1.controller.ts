import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreatePaymentResponseDto } from '../dto/create-payment-response.dto';
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
import { PaymentProvider } from '../../stores/entities/store-payment-config.entity';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  /**
   * Crear una orden de pago para una tienda.
   *
   * @param CreatePaymentDto - Datos de la orden de pago
   * @param user - Usuario Autenticado
   * @returns URL de aprobación de PayPal y datos del pago
   */
  @Post('checkout')
  @ApiOperation({
    summary: 'Crear orden de pago',
    description:
      'Inicia el proceso de pago para una orden. ' +
      'El frontend debe redirigir al cliente a `approvalUrl` para completar el pago.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Posibles causas:\n' +
      '- La orden no existe aun en el sistema.\n' +
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

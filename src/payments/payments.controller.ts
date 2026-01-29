import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { PaymentsService } from './payments.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PayloadToken } from 'src/auth/models/token.model';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StorePaymentConfigResponseDto } from './dto/store-payment-config-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Crea la configuración de pago de PayPal o Stripe para una tienda.
   * @param storeId - ID de la tienda
   * @param dto - Datos de la configuración de pago
   */
  @Post('stores/:storeId/payment-config')
  @Serialize(StorePaymentConfigResponseDto)
  @ApiOperation({ summary: 'Crear configuración de pago para una tienda' })
  @ApiCreatedResponse({
    description: 'Configuración creada correctamente',
    type: StorePaymentConfigResponseDto,
  })
  async createStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreatePaymentConfigDto,
  ): Promise<StorePaymentConfigResponseDto> {
    return await this.paymentsService.createStorePaymentConfig(storeId, dto);
  }

  /**
   * Obtiene las configuraciones de pago de una tienda.
   * @param storeId - ID de la tienda
   * @returns Configuraciones de pago de la tienda
   */
  @Get('stores/:storeId/payment-config')
  @Serialize(StorePaymentConfigResponseDto)
  @ApiOperation({ summary: 'Obtener configuraciones de pago de la tienda' })
  @ApiOkResponse({
    description: 'Configuraciones obtenidas correctamente',
    type: [StorePaymentConfigResponseDto],
  })
  async getStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<StorePaymentConfigResponseDto[]> {
    return await this.paymentsService.getStorePaymentConfigs(storeId);
  }

  /**
   * Actualiza la configuración de pago de PayPal o Stripe para una tienda.
   * @param storeId - ID de la tienda
   * @param id - ID de la configuración de pago
   * @param dto - Datos de la configuración de pago
   */
  @Put('stores/:storeId/payment-config/:id')
  @Serialize(StorePaymentConfigResponseDto)
  @ApiOperation({ summary: 'Actualizar configuración de pago' })
  @ApiOkResponse({
    description: 'Configuración actualizada correctamente',
    type: StorePaymentConfigResponseDto,
  })
  async updateStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentConfigDto,
  ): Promise<StorePaymentConfigResponseDto> {
    return (await this.paymentsService.updateStorePaymentConfig(
      storeId,
      id,
      dto,
    )) as StorePaymentConfigResponseDto;
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
  async capturePayment(@Body('paypalOrderId') paypalOrderId: string) {
    return await this.paymentsService.capturePayment(paypalOrderId);
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

  @Get('success')
  @OptionalAuth()
  @ApiOperation({
    summary: 'Redirect de PayPal: recibir token y PayerID y capturar pago',
  })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'PayerID', required: false })
  async paymentSuccess(
    @Query('token') token: string,
    @Query('PayerID') payerId?: string,
  ) {
    // token = PayPal order id en el redirect
    try {
      const result = await this.paymentsService.capturePayment(String(token));
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

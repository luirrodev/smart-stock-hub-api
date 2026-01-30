import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { CreatePaymentConfigDto } from 'src/payments/dto/payment-config.dto';
import { StorePaymentConfigResponseDto } from 'src/payments/dto/store-payment-config-response.dto';

@Controller('stores')
export class StoresController {
  constructor() {}
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
  ) {
    // return await this.paymentsService.createStorePaymentConfig(storeId, dto);
  }
}

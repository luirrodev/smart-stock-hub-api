import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Serialize } from 'src/common/decorators/serialize.decorator';

import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from '../dtos/payment-config.dto';
import { StorePaymentConfigResponseDto } from '../dtos/store-payment-config-response.dto';

import { StoresPaymentConfigService } from '../services/stores-payment-config.service';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesPaymentConfigService: StoresPaymentConfigService,
  ) {}
  /**
   * Obtiene las configuraciones de pago de una tienda.
   * @param storeId - ID de la tienda
   * @returns Configuraciones de pago de la tienda
   */
  @Get('/:storeId/payment-config')
  @Serialize(StorePaymentConfigResponseDto)
  @ApiOperation({ summary: 'Obtener configuraciones de pago de la tienda' })
  @ApiOkResponse({
    description: 'Configuraciones obtenidas correctamente',
    type: [StorePaymentConfigResponseDto],
  })
  async getStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<StorePaymentConfigResponseDto[]> {
    return await this.storesPaymentConfigService.getStorePaymentConfigs(
      storeId,
    );
  }
  /**
   * Crea la configuración de pago de PayPal o Stripe para una tienda.
   * @param storeId - ID de la tienda
   * @param dto - Datos de la configuración de pago
   */
  @Post('/:storeId/payment-config')
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
    return await this.storesPaymentConfigService.createStorePaymentConfig(
      storeId,
      dto,
    );
  }
  /**
   * Actualiza la configuración de pago de PayPal o Stripe para una tienda.
   * @param storeId - ID de la tienda
   * @param id - ID de la configuración de pago
   * @param dto - Datos de la configuración de pago
   */
  @Put('stores/:storeId/payment-config/')
  @Serialize(StorePaymentConfigResponseDto)
  @ApiOperation({ summary: 'Actualizar configuración de pago' })
  @ApiOkResponse({
    description: 'Configuración actualizada correctamente',
    type: StorePaymentConfigResponseDto,
  })
  async updateStorePaymentConfig(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: UpdatePaymentConfigDto,
  ): Promise<StorePaymentConfigResponseDto> {
    return await this.storesPaymentConfigService.updateStorePaymentConfig(
      storeId,
      dto,
    );
  }
}

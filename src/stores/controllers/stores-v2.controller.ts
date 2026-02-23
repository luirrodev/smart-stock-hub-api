import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { CreateStoreDto, UpdateStoreDto } from '../dtos/create-store.dto';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from '../dtos/payment-config.dto';
import { StorePaymentConfigResponseDto } from '../dtos/store-payment-config-response.dto';
import { StoreResponseDto } from '../dtos/store-response.dto';

import { StoresPaymentConfigService } from '../services/stores-payment-config.service';
import { StoresService } from '../services/stores.service';

@ApiTags('Stores')
@Controller({
  path: 'stores',
  version: '2',
})
export class StoresV2Controller {
  constructor(
    private readonly storesPaymentConfigService: StoresPaymentConfigService,
    private readonly storesService: StoresService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tiendas paginadas' })
  @ApiOkResponse({
    description: 'Lista paginada de tiendas',
  })
  async getAllStores(@Query() paginationDto: PaginationDto) {
    return await this.storesService.findAll(paginationDto);
  }

  @Get(':id')
  @Serialize(StoreResponseDto)
  @ApiOperation({ summary: 'Obtener una tienda por ID' })
  @ApiOkResponse({
    description: 'Tienda encontrada',
    type: StoreResponseDto,
  })
  async getStoreById(@Param('id', ParseIntPipe) id: number) {
    return await this.storesService.findOne(id);
  }

  @Post()
  @Serialize(StoreResponseDto)
  @ApiOperation({ summary: 'Crear una nueva tienda' })
  @ApiCreatedResponse({
    description: 'Tienda creada correctamente',
    type: StoreResponseDto,
  })
  async createStore(@Body() dto: CreateStoreDto) {
    return await this.storesService.create(dto);
  }

  @Put(':id')
  @Serialize(StoreResponseDto)
  @ApiOperation({ summary: 'Actualizar una tienda' })
  @ApiOkResponse({
    description: 'Tienda actualizada correctamente',
    type: StoreResponseDto,
  })
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return await this.storesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una tienda (soft delete)' })
  @ApiNoContentResponse({
    description: 'Tienda eliminada correctamente',
  })
  async deleteStore(@Param('id', ParseIntPipe) id: number) {
    await this.storesService.remove(id);
  }

  @Post(':id/regenerate-api-key')
  @Serialize(StoreResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerar API key de una tienda' })
  @ApiOkResponse({
    description: 'API key regenerada correctamente',
    type: StoreResponseDto,
  })
  async regenerateApiKey(@Param('id', ParseIntPipe) id: number) {
    return await this.storesService.regenerateApiKey(id);
  }

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
  @Put('/:storeId/payment-config/')
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

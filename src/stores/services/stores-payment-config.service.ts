import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';

import { decrypt, encrypt } from 'src/common/utils/crypto.util';

import {
  PaymentProvider,
  StorePaymentConfig,
} from '../entities/store-payment-config.entity';
import { StoresService } from './stores.service';

import { CreatePaymentConfigDto } from '../dtos/payment-config.dto';
import { StorePaymentConfigResponseDto } from '../dtos/store-payment-config-response.dto';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class StoresPaymentConfigService {
  constructor(
    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,
    private readonly storesService: StoresService,
  ) {}

  /**
   * Crea una nueva configuración de pago para una tienda.
   *
   * @throws {BadRequestException} si ya existe una configuración de pago con el mismo proveedor y modo para la tienda.
   * @throws {InternalServerErrorException} si hay un error al cifrar el secreto.
   *
   * @param {number} storeId - el ID de la tienda.
   * @param {CreatePaymentConfigDto} dto - los datos para crear la configuración de pago.
   *
   * @returns {Promise<StorePaymentConfigResponseDto>} - la configuración de pago creada.
   */
  async createStorePaymentConfig(
    storeId: number,
    dto: CreatePaymentConfigDto,
  ): Promise<StorePaymentConfigResponseDto> {
    // Verificar que la tienda exista (usa StoresService que lanza NotFoundException)
    await this.storesService.findOne(storeId);

    // validar que no exista otra configuración activa del mismo proveedor para esa tienda
    const existingActive = await this.storePaymentConfigRepo.findOne({
      where: { storeId, provider: dto.provider, mode: dto.mode },
    });
    if (existingActive) {
      throw new BadRequestException(
        `Ya existe una configuración activa de ${dto.provider} en modo ${dto.mode} para esta tienda`,
      );
    }

    // Crear y guardar la configuración (secret se encripta)
    let encryptedSecret: string;
    try {
      encryptedSecret = encrypt(dto.secret);
    } catch (err) {
      throw new InternalServerErrorException('Error al encriptar el secret');
    }

    const config = this.storePaymentConfigRepo.create({
      storeId,
      provider: dto.provider,
      clientId: dto.clientId,
      secret: encryptedSecret,
      mode: dto.mode,
      isActive: !!dto.isActive,
      webhookUrl: dto.webhookUrl ?? null,
    });

    return await this.storePaymentConfigRepo.save(config);
  }

  /**
   * Lista las configuraciones de pago de una tienda (no devuelve el secret)
   */
  async getStorePaymentConfigs(
    storeId: number,
    provider?: PaymentProvider,
  ): Promise<StorePaymentConfigResponseDto[]> {
    await this.storesService.findOne(storeId);

    let whereClause: FindOptionsWhere<StorePaymentConfig> = { storeId };

    if (provider) {
      whereClause = { storeId, provider };
    }

    const configs = await this.storePaymentConfigRepo.find({
      where: whereClause,
      order: { id: 'ASC' },
    });

    if (!configs) {
      throw new NotFoundException(
        'No se encontró ninguna configuración de pago para esta tienda',
      );
    }

    return configs;
  }

  /**
   * Obtiene la configuración de un proveedor de pago de una tienda
   * @param storeId - ID de la tienda
   * @param provider - Proveedor de pago
   * @returns Credenciales descifradas
   */
  private async getStoreProviderConfig(
    storeId: number,
    provider: PaymentProvider,
  ) {
    const config = await this.storePaymentConfigRepo.findOne({
      where: {
        storeId,
        provider,
        isActive: true,
      },
    });

    if (!config) {
      throw new NotFoundException(
        `No se encontró configuración activa de ${provider} para la tienda ${storeId}`,
      );
    }

    // Descifrar el secret
    const decryptedSecret = decrypt(config.secret);

    return {
      clientId: config.clientId,
      secret: decryptedSecret,
      mode: config.mode,
    };
  }
}

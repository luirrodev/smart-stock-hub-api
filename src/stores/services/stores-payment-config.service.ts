import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';

import { encrypt } from 'src/common/utils/crypto.util';

import { StorePaymentConfig } from '../entities/store-payment-config.entity';
import { StoresService } from './stores.service';

import { CreatePaymentConfigDto } from '../dtos/payment-config.dto';
import { StorePaymentConfigResponseDto } from '../dtos/store-payment-config-response.dto';

@Injectable()
export class StoresPaymentConfigService {
  constructor(
    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,
    private readonly storesService: StoresService,
  ) {}

  // Crea la configuración de pago para una tienda
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
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import {
  StorePaymentConfig,
  PaymentProvider,
} from './entities/store-payment-config.entity';
import { StoresService } from '../stores/services/stores.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,

    private readonly storesService: StoresService,
  ) {}

  // Crea la configuración de pago para una tienda
  async createStorePaymentConfig(
    storeId: number,
    dto: CreatePaymentConfigDto,
  ): Promise<void> {
    // Validar proveedor soportado
    const allowedProviders = [PaymentProvider.PAYPAL, PaymentProvider.STRIPE];
    if (!allowedProviders.includes(dto.provider as PaymentProvider)) {
      throw new BadRequestException('Proveedor de pago no soportado');
    }

    // Verificar que la tienda exista (usa StoresService que lanza NotFoundException)
    await this.storesService.findOne(storeId);

    // Si la nueva configuración viene como activa, desactivar cualquier otra activa del mismo provider en la tienda
    if (dto.isActive) {
      const existingActive = await this.storePaymentConfigRepo.findOne({
        where: { storeId, provider: dto.provider, isActive: true },
      });

      if (existingActive) {
        existingActive.isActive = false;
        await this.storePaymentConfigRepo.save(existingActive);
      }
    }

    // Crear y guardar la configuración (secret se almacena tal cual por ahora; en el futuro debe encriptarse)
    const config = this.storePaymentConfigRepo.create({
      storeId,
      provider: dto.provider,
      clientId: dto.clientId,
      secret: dto.secret,
      mode: dto.mode,
      isActive: !!dto.isActive,
      webhookUrl: dto.webhookUrl ?? null,
    });

    await this.storePaymentConfigRepo.save(config);
  }

  // Placeholder: obtiene la configuración de pago para la tienda
  async getStorePaymentConfig(storeId: number): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: actualiza la configuración de pago
  async updateStorePaymentConfig(
    storeId: number,
    id: number,
    dto: UpdatePaymentConfigDto,
  ): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: procesa un reembolso
  async refundPayment(paymentId: number, dto: RefundPaymentDto): Promise<void> {
    // TODO: Implementar lógica real con provider
    return;
  }
}

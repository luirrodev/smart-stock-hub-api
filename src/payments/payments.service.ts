import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { encrypt } from 'src/common/utils/crypto.util';
import { PaypalService } from './providers/paypal/paypal.service';
import { NotFoundException, Logger } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,

    private readonly storesService: StoresService,

    private readonly paypalService: PaypalService,
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

    await this.storePaymentConfigRepo.save(config);

    // Invalidar token de PayPal para esta tienda (si existía)
    try {
      await this.paypalService.invalidateToken(String(storeId));
    } catch (err) {
      this.logger.warn(
        'No se pudo invalidar token de PayPal:',
        err?.message || err,
      );
    }
  }

  // Placeholder: obtiene la configuración de pago para la tienda
  async getStorePaymentConfig(storeId: number): Promise<void> {
    // TODO: Implementar lógica real
    return;
  }

  // Placeholder: actualiza la configuración de pago
  // async updateStorePaymentConfig(
  //   storeId: number,
  //   id: number,
  //   dto: UpdatePaymentConfigDto,
  // ): Promise<void> {
  //   // Buscar configuración
  //   const config = await this.storePaymentConfigRepo.findOne({
  //     where: { id, storeId },
  //   });

  //   if (!config) {
  //     throw new NotFoundException('Payment config not found');
  //   }

  //   // Aplicar cambios
  //   if (dto.clientId !== undefined) config.clientId = dto.clientId;
  //   if (dto.secret !== undefined) config.secret = encrypt(dto.secret);
  //   if (dto.mode !== undefined) config.mode = dto.mode;
  //   if (dto.isActive !== undefined) config.isActive = dto.isActive;
  //   if (dto.webhookUrl !== undefined) config.webhookUrl = dto.webhookUrl ?? null;

  //   await this.storePaymentConfigRepo.save(config);

  //   // Invalidar token de PayPal para esta tienda (por si se cambió credenciales/activación)
  //   try {
  //     await this.paypalService.invalidateToken(String(storeId));
  //   } catch (err) {
  //     this.logger.warn('No se pudo invalidar token de PayPal:', err?.message || err);
  //   }
  // }

  // Placeholder: procesa un reembolso
  async refundPayment(paymentId: number, dto: RefundPaymentDto): Promise<void> {
    // TODO: Implementar lógica real con provider
    return;
  }
}

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PayloadToken } from 'src/auth/models/token.model';
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
import { decrypt, encrypt } from 'src/common/utils/crypto.util';
import { PaypalService } from './providers/paypal/paypal.service';
import { NotFoundException, Logger } from '@nestjs/common';
import {
  PaymentTransaction,
  TransactionType,
} from './entities/payment-transaction.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { OrdersService } from 'src/orders/services/orders.service';
import { PayPalMode } from './providers/paypal/paypal.constants';
import { CreatePayPalOrderRequest } from './providers/paypal/paypal.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,

    @InjectRepository(StorePaymentConfig)
    private readonly storePaymentConfigRepo: Repository<StorePaymentConfig>,

    private readonly paypalService: PaypalService,
    private ordersService: OrdersService,
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

  /**
   * Inicia el proceso de pago creando una orden en PayPal
   * @param orderId - ID de la orden en tu sistema
   * @param user - Usuario Autenticado
   * @returns URL de aprobación de PayPal y datos del pago
   */
  async initiatePayment(orderId: number, user?: PayloadToken) {
    // 1. Obtener la orden de tu sistema (valida permisos si user es customer)
    const order = await this.ordersService.findOne(orderId, user);

    // 2. Validar que la orden esté en estado correcto
    if (order.status.code !== 'pending') {
      throw new BadRequestException(
        `La orden ${orderId} no está en estado PENDING_PAYMENT`,
      );
    }

    // 3. Verificar que no exista un pago en proceso
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        orderId,
        status: PaymentStatus.CREATED,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        `Ya existe un pago en proceso para la orden ${orderId}`,
      );
    }

    // 4. Obtener configuración de PayPal de la tienda
    const paypalConfig = await this.getStorePayPalConfig(order.storeId);

    // 5. Preparar datos para PayPal
    // Nota: los campos tipo numeric en Postgres suelen venir como string desde TypeORM,
    // convertirlos a número antes de usar toFixed
    const subtotalNum = Number(order.subtotal || 0);
    const totalNum = Number(order.total || 0);
    const shippingNum = Number(order.shippingCost || 0);
    const taxNum = Number(order.tax || 0);

    const paypalOrderData: CreatePayPalOrderRequest = {
      intent: 'CAPTURE' as const,
      purchase_units: [
        {
          reference_id: order.id + '',
          amount: {
            currency_code: order.currency || 'USD',
            value: totalNum.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: order.currency || 'USD',
                value: subtotalNum.toFixed(2),
              },
              shipping: {
                currency_code: order.currency || 'USD',
                value: shippingNum.toFixed(2),
              },
              tax_total: {
                currency_code: order.currency || 'USD',
                value: taxNum.toFixed(2),
              },
            },
          },
          description: `Orden #${order.orderNumber}`,
        },
      ],
      application_context: {
        // TODO agregar FRONTEND_URL como variable de entorno
        return_url: `http://mandaloca.com/payment/success`,
        cancel_url: `http://mandaloca.com/payment/cancel`,
        brand_name: order.store.name, // Nombre de la tienda
        user_action: 'PAY_NOW' as const,
      },
    };

    // 6. Crear orden en PayPal
    let paypalOrder;
    try {
      paypalOrder = await this.paypalService.createOrder(
        paypalConfig,
        paypalOrderData,
        order.storeId,
      );
    } catch (error) {
      this.logger.error(`Error creando orden en PayPal: ${error.message}`);
      throw new BadRequestException('Error al procesar el pago con PayPal');
    }

    // 7. Crear registro de Payment en tu BD
    const payment = this.paymentRepository.create({
      orderId: order.id,
      storeId: order.storeId,
      provider: 'paypal',
      providerOrderId: paypalOrder.id,
      amount: totalNum,
      currency: order.currency || 'USD',
      status: PaymentStatus.CREATED,
    });

    await this.paymentRepository.save(payment);

    // 8. Guardar transacción de creación
    const transaction = this.transactionRepository.create({
      paymentId: payment.id,
      transactionType: TransactionType.CREATE,
      providerTransactionId: paypalOrder.id,
      requestPayload: paypalOrderData,
      responsePayload: paypalOrder,
      status: 'SUCCESS',
    });

    await this.transactionRepository.save(transaction);

    // 9. Obtener URL de aprobación
    const approvalUrl = paypalOrder.links.find(
      (link) => link.rel === 'approve',
    )?.href;

    if (!approvalUrl) {
      throw new BadRequestException('No se obtuvo URL de aprobación de PayPal');
    }

    // 10. Retornar datos al frontend
    return {
      paymentId: payment.id,
      paypalOrderId: paypalOrder.id,
      approvalUrl,
      status: payment.status,
    };
  }

  /**
   * Captura un pago después de que el cliente lo aprobó
   * @param paypalOrderId - ID de la orden de PayPal
   * @returns Datos del pago capturado
   */
  async capturePayment(paypalOrderId: string, user?: PayloadToken) {
    // 1. Buscar el pago en tu BD
    const payment = await this.paymentRepository.findOne({
      where: { providerOrderId: paypalOrderId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(
        `No se encontró pago con PayPal Order ID: ${paypalOrderId}`,
      );
    }

    // 2. Validar estado del pago
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Este pago ya fue completado');
    }

    if (payment.status === 'FAILED') {
      throw new BadRequestException('Este pago falló y no puede ser capturado');
    }

    // 3. Obtener configuración de PayPal
    const paypalConfig = await this.getStorePayPalConfig(payment.storeId);

    // 4. Capturar pago en PayPal
    let captureResponse;
    try {
      captureResponse = await this.paypalService.captureOrder(
        paypalOrderId,
        paypalConfig,
        payment.storeId,
      );
    } catch (error) {
      // Guardar transacción fallida
      await this.transactionRepository.save({
        paymentId: payment.id,
        transactionType: TransactionType.CAPTURE,
        providerTransactionId: paypalOrderId,
        requestPayload: { paypalOrderId },
        responsePayload: error.response?.data || { error: error.message },
        status: 'FAILED',
      });

      // Actualizar payment a FAILED
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      throw new BadRequestException('Error al capturar el pago en PayPal');
    }

    // 5. Extraer Capture ID de la respuesta
    const captureId =
      captureResponse.purchase_units[0]?.payments?.captures[0]?.id;

    // 6. Actualizar Payment en BD
    payment.status = PaymentStatus.COMPLETED;
    payment.providerOrderId = captureId;
    await this.paymentRepository.save(payment);

    // 7. Guardar transacción exitosa
    await this.transactionRepository.save({
      paymentId: payment.id,
      transactionType: TransactionType.CAPTURE,
      providerTransactionId: captureId,
      requestPayload: { paypalOrderId },
      responsePayload: captureResponse,
      status: 'SUCCESS',
    });

    // 8. Actualizar estado de la orden
    await this.ordersService.changeStatusByCode(
      payment.orderId,
      'payment_accepted',
    );

    this.logger.log(`Pago capturado exitosamente. Payment ID: ${payment.id}`);

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      captureId,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  /**
   * Obtiene el estado actual de un pago
   * @param paymentId - ID del pago
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: Number(paymentId) },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Pago ${paymentId} no encontrado`);
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /**
   * Obtiene la configuración de PayPal de una tienda
   * @param storeId - ID de la tienda
   * @returns Credenciales descifradas
   */
  private async getStorePayPalConfig(storeId: number) {
    const config = await this.storePaymentConfigRepo.findOne({
      where: {
        storeId,
        provider: 'paypal',
        isActive: true,
      },
    });

    if (!config) {
      throw new NotFoundException(
        `No se encontró configuración activa de PayPal para la tienda ${storeId}`,
      );
    }

    // Descifrar el secret
    const decryptedSecret = decrypt(config.secret);

    return {
      clientId: config.clientId,
      secret: decryptedSecret,
      mode: PayPalMode[config.mode],
    };
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

  // Procesa un reembolso total o parcial
  async refundPayment(
    paymentId: number | string,
    dtoOrAmount?: RefundPaymentDto | number,
    reason?: string,
  ) {
    // Normalizar parámetros para soportar llamadas desde controller (dto) o directamente (amount, reason)
    let amount: number | undefined;
    let reasonText: string | undefined;

    if (typeof dtoOrAmount === 'object' && dtoOrAmount !== null) {
      amount = dtoOrAmount.amount
        ? Number(parseFloat(dtoOrAmount.amount))
        : undefined;
      reasonText = dtoOrAmount.reason;
    } else if (typeof dtoOrAmount === 'number') {
      amount = dtoOrAmount;
      reasonText = reason;
    }

    // 1. Buscar pago
    const payment = await this.paymentRepository.findOne({
      where: { id: Number(paymentId) },
    });

    if (!payment) {
      throw new NotFoundException(`Pago ${paymentId} no encontrado`);
    }

    // 2. Validar que esté completado
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden reembolsar pagos completados',
      );
    }

    // 3. Validar que tenga Capture ID
    const captureId = payment.providerOrderId;
    if (!captureId) {
      throw new BadRequestException(
        'No se encontró Capture ID para reembolsar',
      );
    }

    // 4. Validar monto si es parcial
    if (amount !== undefined && amount > Number(payment.amount)) {
      throw new BadRequestException(
        'El monto a reembolsar no puede ser mayor al monto del pago',
      );
    }

    // 5. Obtener configuración de PayPal
    const paypalConfig = await this.getStorePayPalConfig(payment.storeId);

    // 6. Preparar datos de reembolso
    const refundData = amount
      ? {
          amount: {
            currency_code: payment.currency,
            value: amount.toFixed(2),
          },
          note_to_payer: reasonText || 'Reembolso procesado',
        }
      : {
          note_to_payer: reasonText || 'Reembolso total procesado',
        };

    // 7. Procesar reembolso en PayPal
    let refundResponse: any;
    try {
      refundResponse = await this.paypalService.refundCapture(
        captureId,
        paypalConfig,
        payment.storeId,
        refundData,
      );
    } catch (error) {
      this.logger.error(`Error procesando reembolso: ${error.message}`);

      // Guardar transacción fallida
      await this.transactionRepository.save({
        paymentId: payment.id,
        transactionType: TransactionType.REFUND,
        providerTransactionId: error.response?.data?.id || null,
        requestPayload: refundData,
        responsePayload: error.response?.data || { error: error.message },
        status: 'FAILED',
      });

      throw new BadRequestException('Error al procesar el reembolso en PayPal');
    }

    // 8. Actualizar Payment
    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepository.save(payment);

    // 9. Guardar transacción
    await this.transactionRepository.save({
      paymentId: payment.id,
      transactionType: TransactionType.REFUND,
      providerTransactionId: refundResponse.id,
      requestPayload: refundData,
      responsePayload: refundResponse,
      status: 'SUCCESS',
    });

    // 10. Actualizar orden si es reembolso total
    if (amount === undefined || amount === Number(payment.amount)) {
      // Marcar la orden como 'refunded' usando el status code
      try {
        await this.ordersService.changeStatusByCode(
          payment.orderId,
          'refunded',
        );
      } catch (err) {
        // No queremos fallar el refund por un problema al actualizar el estado de la orden
        this.logger.warn(
          `No se pudo actualizar el estado de la orden: ${err?.message || err}`,
        );
      }
    }

    return {
      paymentId: payment.id,
      refundId: refundResponse.id,
      status: refundResponse.status,
      amount: refundResponse.amount?.value,
    };
  }
}

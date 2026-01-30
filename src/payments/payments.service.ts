import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PayloadToken } from '../auth/models/token.model';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProviderConfig } from './providers/payment-provider.interface';
import {
  PaymentTransaction,
  TransactionType,
} from './entities/payment-transaction.entity';
import { CreateProviderOrderResponseDto } from './dto/create-provider-order-response.dto';
import { PaymentStatus } from './entities/payment-status.enum';

import { PaymentProvider } from '../stores/entities/store-payment-config.entity';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

import { StoresPaymentConfigService } from '../stores/services/stores-payment-config.service';
import { PaypalService } from './providers/paypal/paypal.service';
import { OrdersService } from '../orders/services/orders.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,

    private readonly paypalService: PaypalService,
    private readonly ordersService: OrdersService,
    private readonly storePaymentConfigService: StoresPaymentConfigService,
  ) {}

  /**
   * Inicia el proceso de pago creando una orden en el proveedor correspondiente
   * @param data - Datos del pago (orderId, provider)
   * @param user - Usuario autenticado
   * @returns URL de aprobación y datos del pago
   */
  async initiatePayment(data: CreatePaymentDto, user: PayloadToken) {
    // 1. Obtener la orden de tu sistema
    const order = await this.ordersService.findOne(data.orderId, user);

    // 2. Validar que la orden esté en estado correcto
    if (order.status.code !== 'pending') {
      throw new BadRequestException(
        `La orden en cuestión no está en estado: Pendiente de Pago`,
      );
    }

    // 3. Verificar que no exista un pago en proceso para esta orden
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        orderId: data.orderId,
        status: PaymentStatus.CREATED,
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        `Ya existe un pago en proceso para la orden en cuestión`,
      );
    }

    // 4. Verificar que la tienda tenga configuración de pago activa para este proveedor
    const config = await this.storePaymentConfigService.getStoreProviderConfig(
      order.storeId,
      data.provider,
    );

    // 5. Delegar la creación de la orden al proveedor específico
    const providerResponse = await this.createProviderOrder(
      data.provider,
      config,
      order,
    );

    // 6. Crear registro de Payment en tu BD
    const payment = this.paymentRepository.create({
      orderId: order.id,
      storeId: order.storeId,
      provider: data.provider,
      providerOrderId: providerResponse.providerOrderId,
      amount: Number(order.total),
      currency: order.currency,
      status: PaymentStatus.CREATED,
    });

    await this.paymentRepository.save(payment);

    // 7. Guardar transacción de creación
    const transaction = this.transactionRepository.create({
      paymentId: payment.id,
      transactionType: TransactionType.CREATE,
      providerTransactionId: providerResponse.providerOrderId,
      requestPayload: providerResponse.requestPayload,
      responsePayload: providerResponse.responsePayload,
      status: 'SUCCESS',
    });

    await this.transactionRepository.save(transaction);

    // 8. Retornar datos al frontend
    return {
      paymentId: payment.id,
      providerOrderId: providerResponse.providerOrderId,
      approvalUrl: providerResponse.approvalUrl,
      status: payment.status,
    };
  }

  /**
   * Captura un pago después de que el cliente lo aprobó
   * @param providerOrderId - ID de la orden en el proveedor de pago
   * @param provider - Proveedor de pago (paypal, stripe, etc.)
   * @returns Datos del pago capturado
   */
  async capturePayment(providerOrderId: string, provider: PaymentProvider) {
    // Buscar el pago en tu BD
    const payment = await this.paymentRepository.findOne({
      where: { providerOrderId, provider },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(
        `No se encontró pago con ${provider} Order ID: ${providerOrderId}`,
      );
    }

    // Validar estado del pago
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Este pago ya fue completado');
    }

    if (payment.status === 'FAILED') {
      throw new BadRequestException('Este pago falló y no puede ser capturado');
    }

    // Capturar pago según el proveedor
    let captureResponse;
    let captureId: string;

    switch (provider) {
      case PaymentProvider.PAYPAL:
        // 1. Obtener configuración de PayPal de la tienda
        const paypalConfig =
          await this.storePaymentConfigService.getStoreProviderConfig(
            payment.storeId,
            PaymentProvider.PAYPAL,
          );

        // 2. Capturar pago en PayPal
        try {
          captureResponse = await this.paypalService.captureOrder(
            payment.providerOrderId,
            paypalConfig,
            payment.storeId,
          );
        } catch (error) {
          // Guardar transacción fallida
          const transaction = this.transactionRepository.create({
            paymentId: payment.id,
            transactionType: TransactionType.CAPTURE,
            providerTransactionId: payment.providerOrderId,
            requestPayload: { providerOrderId: payment.providerOrderId },
            responsePayload: error.response?.data || { error: error.message },
            status: 'FAILED',
          });

          await this.transactionRepository.save(transaction);

          // Actualizar payment a FAILED
          payment.status = PaymentStatus.FAILED;
          await this.paymentRepository.save(payment);

          throw new BadRequestException('Error al capturar el pago en PayPal');
        }
        // Extraer Capture ID de la respuesta de PayPal
        captureId =
          captureResponse.purchase_units[0]?.payments?.captures[0]?.id;
        break;

      case PaymentProvider.STRIPE:
        // TODO: Implementar captura de Stripe
        // captureResponse = await this.captureStripePayment(providerOrderId, payment);
        // captureId = captureResponse.id;
        throw new BadRequestException(
          'Captura de pagos con Stripe aún no está implementada',
        );

      default:
        throw new BadRequestException(
          `Proveedor de pago no soportado: ${provider}`,
        );
    }

    // 3. Guardar transacción exitosa
    const transaction = this.transactionRepository.create({
      paymentId: payment.id,
      transactionType: TransactionType.CAPTURE,
      providerTransactionId: captureId,
      requestPayload: { providerOrderId },
      responsePayload: captureResponse,
      status: 'SUCCESS',
    });

    await this.transactionRepository.save(transaction);

    // 4. Actualizar Payment en BD
    payment.status = PaymentStatus.COMPLETED;
    payment.providerOrderId = captureId;
    await this.paymentRepository.save(payment);

    // 5. Actualizar estado de la orden
    await this.ordersService.changeStatusByCode(
      payment.orderId,
      'payment_accepted',
    );

    // 6.Actualizar informacion de pago en la orden
    await this.ordersService.changePaymentInfo(payment.orderId, {
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: payment.provider,
      paymentTransactionId: captureId,
    });

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
   * Captura un pago vía webhook de PayPal
   * Implementa idempotencia para evitar procesar el mismo evento múltiples veces
   * @param paypalOrderId - ID de la orden de PayPal
   * @param captureId - ID de la captura de PayPal
   */
  async capturePaymentViaWebhook(
    paypalOrderId: string,
    captureId: string,
  ): Promise<void> {
    // 1. Buscar payment en BD
    const payment = await this.paymentRepository.findOne({
      where: { providerOrderId: paypalOrderId, provider: 'paypal' },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.warn(
        `No se encontró payment para PayPal Order ID: ${paypalOrderId}`,
      );
      return;
    }

    // 2. Verificar idempotencia - si ya fue procesado, no hacer nada
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(
        `Payment ${payment.id} ya está COMPLETED - ignorando webhook duplicado`,
      );
      return;
    }

    // 3. Verificar que no esté en estado fallido
    if (payment.status === PaymentStatus.FAILED) {
      this.logger.warn(
        `Payment ${payment.id} está en estado FAILED - no se puede completar`,
      );
      return;
    }

    // 4. Actualizar payment status a COMPLETED
    payment.status = PaymentStatus.COMPLETED;
    payment.providerOrderId = captureId; // Guardar Capture ID
    await this.paymentRepository.save(payment);

    // 5. Guardar transacción de captura
    await this.transactionRepository.save({
      paymentId: payment.id,
      transactionType: TransactionType.CAPTURE,
      providerTransactionId: captureId,
      requestPayload: { paypalOrderId, source: 'webhook' },
      responsePayload: { captureId, status: 'COMPLETED' },
      status: 'SUCCESS',
    });

    // 6. Actualizar order status a PAID
    try {
      await this.ordersService.changeStatusByCode(
        payment.orderId,
        'payment_accepted',
      );
      this.logger.log(
        `Orden ${payment.orderId} actualizada a 'payment_accepted' via webhook`,
      );
    } catch (error) {
      this.logger.error(
        `Error actualizando orden ${payment.orderId}:`,
        error.message,
      );
      // No lanzamos error para no fallar el webhook
    }

    this.logger.log(
      `Payment ${payment.id} completado exitosamente via webhook`,
    );
  }

  /**
   * Marca un pago como fallido vía webhook
   * @param paypalOrderId - ID de la orden de PayPal
   */
  async markPaymentAsFailed(paypalOrderId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { providerOrderId: paypalOrderId, provider: 'paypal' },
    });

    if (!payment) {
      this.logger.warn(
        `No se encontró payment para PayPal Order ID: ${paypalOrderId}`,
      );
      return;
    }

    // Verificar idempotencia
    if (payment.status === PaymentStatus.FAILED) {
      this.logger.log(
        `Payment ${payment.id} ya está FAILED - ignorando webhook duplicado`,
      );
      return;
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(payment);

    this.logger.log(`Payment ${payment.id} marcado como FAILED via webhook`);
  }

  /**
   * Marca un pago como reembolsado vía webhook
   * @param paypalOrderId - ID de la orden de PayPal
   */
  async markPaymentAsRefunded(paypalOrderId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { providerOrderId: paypalOrderId, provider: 'paypal' },
    });

    if (!payment) {
      this.logger.warn(
        `No se encontró payment para PayPal Order ID: ${paypalOrderId}`,
      );
      return;
    }

    // Verificar idempotencia
    if (payment.status === PaymentStatus.REFUNDED) {
      this.logger.log(
        `Payment ${payment.id} ya está REFUNDED - ignorando webhook duplicado`,
      );
      return;
    }

    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepository.save(payment);

    this.logger.log(`Payment ${payment.id} marcado como REFUNDED via webhook`);
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
   * Delega la creación de orden al proveedor de pago correspondiente
   * @param provider - Proveedor de pago (PayPal, Stripe, etc.)
   * @param config - Configuración del proveedor para la tienda
   * @param order - Orden del sistema
   * @returns Respuesta normalizada del proveedor
   */
  private async createProviderOrder(
    provider: PaymentProvider,
    config: ProviderConfig,
    order: Order,
  ): Promise<CreateProviderOrderResponseDto> {
    switch (provider) {
      case PaymentProvider.PAYPAL:
        const { responseData, payloadData } =
          await this.paypalService.createOrder(config, order);

        // Extraer URL de aprobación
        const approvalUrl = responseData.links.find(
          (link) => link.rel === 'approve',
        )?.href;

        if (!approvalUrl) {
          throw new InternalServerErrorException(
            'No se pudo obtener la URL de aprobación de PayPal',
          );
        }

        return {
          providerOrderId: responseData.id,
          approvalUrl,
          requestPayload: JSON.stringify(payloadData),
          responsePayload: JSON.stringify(responseData),
        };
      case PaymentProvider.STRIPE:
      // return await this.createStripeOrder(config, order);

      default:
        throw new BadRequestException(
          `Proveedor de pago no soportado: ${provider}`,
        );
    }
  }

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
    const paypalConfig =
      await this.storePaymentConfigService.getStoreProviderConfig(
        payment.storeId,
        PaymentProvider.PAYPAL,
      );

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

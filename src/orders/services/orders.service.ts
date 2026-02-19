import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, FulfillmentType } from '../entities/order.entity';
import { OrderItem } from '../entities/order-items.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderStatus } from '../entities/order-status.entity';
import { PickupPoint } from '../entities/pickup-point.entity';
import {
  CreateOrderDto,
  CreateShippingOrderDto,
  CreatePickupOrderDto,
} from '../dtos/create-order.dto';
import { UsersService } from 'src/access-control/users/services/users.service';
import { StoresService } from 'src/stores/services/stores.service';
import { PayloadToken } from 'src/auth/models/token.model';
import { ChangePaymentInfoDto } from '../dtos/change-payment-info.dto';
import { PaymentStatus } from 'src/payments/entities/payment-status.enum';
import {
  buildOrderItems,
  calculateOrderTotals,
  assignOrderTypeFields,
  isShippingOrder,
  isPickupOrder,
} from '../../common/utils/order.util';
import { validateUserStoreContext } from '../../common/utils/validation.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(OrderStatus)
    private orderStatusRepo: Repository<OrderStatus>,
    @InjectRepository(PickupPoint)
    private pickupPointRepo: Repository<PickupPoint>,
    private usersService: UsersService,
    private storeService: StoresService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const prefix =
      'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 0; i < 5; i++) {
      const suffix = Math.floor(100000 + Math.random() * 900000).toString();
      const number = `${prefix}-${suffix}`;
      const existing = await this.orderRepo.findOne({
        where: { orderNumber: number },
      });
      if (!existing) return number;
    }
    throw new Error('No se pudo generar un número de pedido único');
  }

  /**
   * Valida que todos los productos existan en la base de datos
   */
  private async validateProductsExist(
    productIds: number[],
  ): Promise<Product[]> {
    const products = await this.productRepo.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missing = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Productos no encontrados: ${missing.join(', ')}`,
      );
    }

    return products;
  }

  /**
   * Valida que el estado inicial 'pending' exista
   */
  private async validateInitialStatus(): Promise<OrderStatus> {
    const status = await this.orderStatusRepo.findOne({
      where: { code: 'pending' },
    });

    if (!status) {
      throw new NotFoundException('No hay estados de pedido configurados');
    }

    return status;
  }

  /**
   * Valida que el punto de retiro exista (si es orden PICKUP)
   */
  private async validatePickupPoint(dto: CreateOrderDto): Promise<void> {
    if (!isPickupOrder(dto)) {
      return;
    }

    const pickupPoint = await this.pickupPointRepo.findOne({
      where: { id: dto.pickupPointId },
    });

    if (!pickupPoint) {
      throw new NotFoundException('Punto de retiro no encontrado');
    }
  }

  /**
   * Crea un pedido con validación específica según el tipo de cumplimiento.
   *
   * - Para SHIPPING: Requiere dirección de envío completa
   * - Para PICKUP: Requiere punto de retiro válido
   *
   * Luego realiza:
   * - Validación de existencia de productos
   * - Cálculo de subtotal y total (con tax/shipping/discount opcionales)
   * - Asignación de estado inicial ('pending')
   * - Obtiene storeUserId del token del usuario autenticado (multitienda)
   *
   * @param dto - CreateShippingOrderDto | CreatePickupOrderDto
   * @param user - PayloadToken del usuario autenticado (contiene storeId y storeUserId)
   * @returns Orden creada con items y relaciones
   * @throws BadRequestException si no hay storeUserId en el token
   * @throws NotFoundException si la tienda no existe
   */
  async createOrder(dto: CreateOrderDto, user: PayloadToken): Promise<Order> {
    // Fase 1: Validaciones
    validateUserStoreContext(user);

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.validateProductsExist(productIds);

    const status = await this.validateInitialStatus();
    await this.validatePickupPoint(dto);

    // Fase 2: Construcción de datos usando utilidades
    const items = buildOrderItems(dto.items, products);
    const totals = calculateOrderTotals(items as OrderItem[]);
    const orderNumber = await this.generateOrderNumber();
    const store = await this.storeService.findOne(user.storeId!);

    // Fase 3: Creación del objeto de orden
    const orderToSave: Partial<Order> = {
      orderNumber,
      storeUserId: user.storeUserId,
      store,
      fulfillmentType: dto.fulfillmentType,
      statusId: status.id,
      paymentMethod: dto.paymentMethod ?? null,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shippingCost: totals.shippingCost,
      discount: totals.discount,
      total: totals.total,
      currency: dto.currency,
      customerNotes: dto.customerNotes ?? null,
      items: items as OrderItem[],
    };

    assignOrderTypeFields(orderToSave, dto);

    // Fase 4: Persistencia y retorno
    const saved = await this.orderRepo.save(orderToSave as Order);

    const order = await this.orderRepo.findOne({
      where: { id: saved.id },
      relations: ['items', 'store', 'status'],
    });

    return order!;
  }

  /**
   * Obtiene un pedido por id y verifica permisos:
   * - usuarios con role 'customer' solo pueden ver sus propios pedidos
   * (basado en storeUserId del token que está vinculado a la orden)
   */
  async findOne(id: number, user?: PayloadToken): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'store', 'status'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Si el request viene de un usuario tipo customer, asegurar que solo vea sus pedidos
    if (user && user.role === 'customer') {
      const storeUserId = user.storeUserId ?? null;
      if (storeUserId === null || order.storeUserId !== storeUserId) {
        throw new BadRequestException('Access denied to this order');
      }
    }

    return order;
  }

  /**
   * Cambia el estado de un pedido dado su código (p.ej., 'pending', 'shipped')
   * - Valida que el estado exista y esté activo
   * - Evita reasignar el mismo estado
   * - Aplica validaciones específicas para ciertos estados (shipped, delivered, cancelled)
   * @param orderId - ID del pedido
   * @param statusCode - Código del estado destino
   * @param user - Opcional, token del usuario que realiza la acción (se respeta restricción de clientes)
   */
  async changeStatusByCode(
    orderId: number,
    statusCode: string,
    user?: PayloadToken,
  ): Promise<Order> {
    // Reusar la validación de permisos y existencia de pedido
    const order = await this.findOne(orderId, user);

    // Buscar estado por código y activo
    const status = await this.orderStatusRepo.findOne({
      where: { code: statusCode, isActive: true },
    });

    if (!status) {
      throw new NotFoundException('Estado no encontrado o inactivo');
    }

    if (order.statusId === status.id) {
      throw new BadRequestException('El pedido ya posee ese estado');
    }

    // Validaciones específicas
    // - No marcar como 'shipped' si es pickup o si el pago no está pagado
    if (status.code === 'shipped') {
      if (order.fulfillmentType === FulfillmentType.PICKUP) {
        throw new BadRequestException(
          "No se puede marcar como 'shipped' en pedidos para recogida (pickup)",
        );
      }
      if (order.paymentStatus !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          "No se puede enviar un pedido cuyo pago no está marcado como 'paid'",
        );
      }
      order.shippedAt = new Date();
    }

    // - Para marcar como entregado, debe haber sido enviado antes
    if (status.code === 'delivered') {
      if (!order.shippedAt) {
        throw new BadRequestException(
          "No se puede marcar como 'delivered' si el pedido no está marcado como 'shipped'",
        );
      }
      order.deliveredAt = new Date();
    }

    // - Para cancelado, registrar timestamp
    if (status.code === 'cancelled') {
      order.cancelledAt = new Date();
    }

    // Asignar nuevo estado
    order.status = status;
    order.statusId = status.id;

    // Guardar y retornar con relaciones
    const saved = await this.orderRepo.save(order);

    const updated = await this.orderRepo.findOne({
      where: { id: saved.id },
      relations: ['items', 'store', 'status'],
    });

    return updated!;
  }

  async changePaymentInfo(orderId: number, data: ChangePaymentInfoDto) {
    const order = await this.findOne(orderId);

    await this.orderRepo.update(orderId, {
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      paymentTransactionId: data.paymentTransactionId,
    });

    return this.findOne(orderId);
  }
}

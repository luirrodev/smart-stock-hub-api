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
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UsersService } from 'src/access-control/users/services/users.service';
import { StoresService } from 'src/stores/services/stores.service';
import { PayloadToken } from 'src/auth/models/token.model';
import { ChangePaymentInfoDto } from '../dtos/change-payment-info.dto';
import { PaymentStatus } from 'src/payments/entities/payment.entity';

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
   * Crea un pedido básico con items.
   * - Valida que existan los productos
   * - Calcula subtotal, total (tax/shipping/discount opcionales)
   * - Asigna un estado inicial (se busca código 'pending', si no existe, el primero activo)
   */
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const productIds = dto.items.map((i) => i.productId);
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

    // Build order items snapshot
    const items: Partial<OrderItem>[] = dto.items.map((items) => {
      const p = products.find((px) => px.id === items.productId)!;
      const unitPrice = Number(p.salePrice);
      const qty = items.quantity;
      const totalPrice = Number((unitPrice * qty).toFixed(2));
      return {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        productImage: null,
        quantity: qty,
        unitPrice,
        totalPrice,
      };
    });

    const subtotal = Number(
      items
        .reduce((s, it) => s + Number((it.totalPrice as number) || 0), 0)
        .toFixed(2),
    );

    const tax = dto.tax ?? 0;
    const shippingCost = dto.shippingCost ?? 0;
    const discount = dto.discount ?? 0;
    const total = Number((subtotal + tax + shippingCost - discount).toFixed(2));

    // Get initial status (prefer 'pending')
    let status = await this.orderStatusRepo.findOne({
      where: { code: 'pending' },
    });
    // TODO: Configurar en settings el estado inicial
    if (!status) {
      throw new NotFoundException('No hay estados de pedido configurados');
    }

    if (dto.fulfillmentType === FulfillmentType.PICKUP && dto.pickupPointId) {
      const pp = await this.pickupPointRepo.findOne({
        where: { id: dto.pickupPointId },
      });
      if (!pp) throw new NotFoundException('Punto de retiro no encontrado');
    }

    const orderNumber = await this.generateOrderNumber();

    const customerId = await this.usersService.findCustomerIdByUserId(
      dto.userId,
    );

    const store = await this.storeService.findOne(dto.storeId);

    const orderToSave: Partial<Order> = {
      orderNumber,
      customerId,
      store,
      fulfillmentType: dto.fulfillmentType,
      pickupPointId: dto.pickupPointId ?? null,

      shippingProvince: dto.shippingProvince ?? null,
      shippingMunicipality: dto.shippingMunicipality ?? null,
      shippingFirstName: dto.shippingFirstName ?? null,
      shippingMiddleName: dto.shippingMiddleName ?? null,
      shippingLastName: dto.shippingLastName ?? null,
      shippingSecondLastName: dto.shippingSecondLastName ?? null,
      shippingStreet: dto.shippingStreet ?? null,
      shippingNumber: dto.shippingNumber ?? null,
      shippingApartment: dto.shippingApartment ?? null,
      shippingFloor: dto.shippingFloor ?? null,
      shippingBetweenStreets: dto.shippingBetweenStreets ?? null,
      shippingNeighborhood: dto.shippingNeighborhood ?? null,
      shippingPostalCode: dto.shippingPostalCode ?? null,
      shippingContactPhone: dto.shippingContactPhone ?? null,
      shippingReference: dto.shippingReference ?? null,

      statusId: status.id,
      paymentMethod: dto.paymentMethod ?? null,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      currency: dto.currency ?? 'USD',
      customerNotes: dto.customerNotes ?? null,

      items: items as OrderItem[],
    };

    const saved = await this.orderRepo.save(orderToSave as Order);

    // Re-obtener con relaciones para asegurarnos de que las subentidades (items, store, status) estén presentes
    const order = await this.orderRepo.findOne({
      where: { id: saved.id },
      relations: ['items', 'store', 'status'],
    });

    return order!;
  }

  /**
   * Obtiene un pedido por id y verifica permisos:
   * - usuarios con role 'customer' solo pueden ver sus propios pedidos
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
      const custId = user.customerId ?? null;
      if (custId === null || order.customerId !== custId) {
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

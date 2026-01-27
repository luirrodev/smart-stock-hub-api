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

    const orderToSave: Partial<Order> = {
      orderNumber,
      customerId: dto.customerId,
      storeId: dto.storeId,
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

    const order = await this.orderRepo.save(orderToSave as Order);
    return order;
  }
}

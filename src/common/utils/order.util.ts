import { OrderItem } from '../../orders/entities/order-items.entity';
import { Order, FulfillmentType } from '../../orders/entities/order.entity';
import {
  CreateOrderDto,
  CreateShippingOrderDto,
  CreatePickupOrderDto,
} from '../../orders/dtos/create-order.dto';
import { Product } from '../../products/entities/product.entity';

/**
 * Construye los items de una orden con snapshot de precios desde productos
 * @param dtoItems - Items del DTO de creación
 * @param products - Productos encontrados en BD
 * @returns Array de OrderItems con precios calculados
 */
export function buildOrderItems(
  dtoItems: CreateOrderDto['items'],
  products: Product[],
): Partial<OrderItem>[] {
  return dtoItems.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const unitPrice = Number(product.salePrice);
    const qty = item.quantity;
    const totalPrice = Number((unitPrice * qty).toFixed(2));

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productImage: null,
      quantity: qty,
      unitPrice,
      totalPrice,
    };
  });
}

/**
 * Calcula los totales de una orden (subtotal, tax, shipping, discount, total)
 * @param items - Items de la orden
 * @returns Objeto con todos los totales calculados
 */
export function calculateOrderTotals(items: OrderItem[]): {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
} {
  const subtotal = Number(
    items
      .reduce((s, it) => s + Number((it.totalPrice as number) || 0), 0)
      .toFixed(2),
  );

  // TODO: Aplicar tax, shippingCost y discount según lógica de negocio
  const tax = 0;
  const shippingCost = 0;
  const discount = 0;
  const total = Number((subtotal + tax + shippingCost - discount).toFixed(2));

  return { subtotal, tax, shippingCost, discount, total };
}

/**
 * Type guard para validar si el DTO es de tipo SHIPPING
 */
export function isShippingOrder(
  dto: CreateOrderDto,
): dto is CreateShippingOrderDto {
  return dto.fulfillmentType === FulfillmentType.SHIPPING;
}

/**
 * Type guard para validar si el DTO es de tipo PICKUP
 */
export function isPickupOrder(
  dto: CreateOrderDto,
): dto is CreatePickupOrderDto {
  return dto.fulfillmentType === FulfillmentType.PICKUP;
}

/**
 * Asigna los campos específicos de la orden según su tipo (SHIPPING o PICKUP)
 * @param orderToSave - Objeto parcial de la orden a persistir
 * @param dto - DTO de creación con los datos
 */
export function assignOrderTypeFields(
  orderToSave: Partial<Order>,
  dto: CreateOrderDto,
): void {
  if (isPickupOrder(dto)) {
    orderToSave.pickupPointId = dto.pickupPointId;
  } else if (isShippingOrder(dto)) {
    orderToSave.pickupPointId = null;
    orderToSave.shippingProvince = dto.shippingProvince;
    orderToSave.shippingMunicipality = dto.shippingMunicipality;
    orderToSave.shippingFirstName = dto.shippingFirstName;
    orderToSave.shippingMiddleName = dto.shippingMiddleName;
    orderToSave.shippingLastName = dto.shippingLastName;
    orderToSave.shippingSecondLastName = dto.shippingSecondLastName;
    orderToSave.shippingStreet = dto.shippingStreet;
    orderToSave.shippingNumber = dto.shippingNumber;
    orderToSave.shippingApartment = dto.shippingApartment;
    orderToSave.shippingFloor = dto.shippingFloor;
    orderToSave.shippingBetweenStreets = dto.shippingBetweenStreets;
    orderToSave.shippingNeighborhood = dto.shippingNeighborhood;
    orderToSave.shippingPostalCode = dto.shippingPostalCode;
    orderToSave.shippingContactPhone = dto.shippingContactPhone;
    orderToSave.shippingReference = dto.shippingReference;
  }
}

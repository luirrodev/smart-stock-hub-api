import { OrderItem } from '../../orders/entities/order-items.entity';
import { Order, FulfillmentType } from '../../orders/entities/order.entity';
import {
  CreateOrderDto,
  CreateShippingOrderDto,
  CreatePickupOrderDto,
} from '../../orders/dtos/create-order.dto';
import { ProductStore } from '../../products/entities/product-store.entity';

/**
 * Construye los items de una orden con snapshot de precios desde ProductStore
 * @param dtoItems - Items del DTO de creación
 * @param productStores - Configuraciones de producto en tienda encontradas en BD
 * @returns Array de OrderItems con precios calculados desde ProductStore
 */
export function buildOrderItems(
  dtoItems: CreateOrderDto['items'],
  productStores: ProductStore[],
): Partial<OrderItem>[] {
  return dtoItems.map((item) => {
    const productStore = productStores.find((ps) => ps.id === item.productId)!;
    const unitPrice = Number(productStore.price);
    const qty = item.quantity;
    const totalPrice = Number((unitPrice * qty).toFixed(2));

    return {
      productStoreId: productStore.id,
      productName: productStore.name,
      productSku: productStore.product.sku,
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
  const shippingCost = 5.95; // Ejemplo de costo de envío fijo
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

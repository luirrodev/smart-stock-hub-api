import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDto } from './order-item-response.dto';
import { StoreResponseDto } from '../../stores/dtos/store-response.dto';

export class OrderResponseDto {
  @ApiProperty({ example: 'ORD-20260127-396973' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ example: 10 })
  @Expose()
  customerId: number;

  @ApiProperty({ type: () => StoreResponseDto })
  @Expose()
  @Type(() => StoreResponseDto)
  store: StoreResponseDto;

  @ApiProperty({ example: 'shipping' })
  @Expose()
  fulfillmentType: string;

  @ApiProperty({ example: null, required: false })
  @Expose()
  pickupPointId: number | null;

  // Shipping snapshot
  @ApiProperty({ example: 'Provincia X' })
  @Expose()
  shippingProvince: string | null;

  @ApiProperty({ example: 'Municipio Y' })
  @Expose()
  shippingMunicipality: string | null;

  @ApiProperty({ example: 'Juan' })
  @Expose()
  shippingFirstName: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingMiddleName: string | null;

  @ApiProperty({ example: 'Pérez' })
  @Expose()
  shippingLastName: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingSecondLastName: string | null;

  @ApiProperty({ example: 'Av. Siempre Viva' })
  @Expose()
  shippingStreet: string | null;

  @ApiProperty({ example: '123' })
  @Expose()
  shippingNumber: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingApartment: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingFloor: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingBetweenStreets: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingNeighborhood: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingPostalCode: string | null;

  @ApiProperty({ example: '+56912345678' })
  @Expose()
  shippingContactPhone: string | null;

  @ApiProperty({ example: null, required: false })
  @Expose()
  shippingReference: string | null;

  @ApiProperty({ example: 1 })
  @Expose()
  statusId: number;

  @ApiProperty({ example: 'card', required: false })
  @Expose()
  paymentMethod: string | null;

  @ApiProperty({ example: 388 })
  @Expose()
  subtotal: number;

  @ApiProperty({ example: '0.00' })
  @Expose()
  tax: number;

  @ApiProperty({ example: '0.00' })
  @Expose()
  shippingCost: number;

  @ApiProperty({ example: '0.00' })
  @Expose()
  discount: number;

  @ApiProperty({ example: 388 })
  @Expose()
  total: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({
    example: 'Por favor entregar en horario de la tarde',
    required: false,
  })
  @Expose()
  customerNotes: string | null;

  @ApiProperty({ type: () => OrderItemResponseDto, isArray: true })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

  @ApiProperty({ example: 1 })
  @Expose()
  storeId: number;

  @ApiProperty({ example: 'pending' })
  @Expose()
  paymentStatus: string;

  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: '2026-01-27T16:31:57.646Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-01-27T16:31:57.646Z' })
  @Expose()
  updatedAt: Date;
}

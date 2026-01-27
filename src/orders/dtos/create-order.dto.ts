import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @IsInt()
  @IsOptional()
  userId: number;

  @IsInt()
  storeId: number;

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @IsOptional()
  @IsInt()
  pickupPointId?: number;

  // Shipping snapshot fields (optional for pickup)
  @IsOptional()
  @IsString()
  shippingProvince?: string;

  @IsOptional()
  @IsString()
  shippingMunicipality?: string;

  @IsOptional()
  @IsString()
  shippingFirstName?: string;

  @IsOptional()
  @IsString()
  shippingMiddleName?: string;

  @IsOptional()
  @IsString()
  shippingLastName?: string;

  @IsOptional()
  @IsString()
  shippingSecondLastName?: string;

  @IsOptional()
  @IsString()
  shippingStreet?: string;

  @IsOptional()
  @IsString()
  shippingNumber?: string;

  @IsOptional()
  @IsString()
  shippingApartment?: string;

  @IsOptional()
  @IsString()
  shippingFloor?: string;

  @IsOptional()
  @IsString()
  shippingBetweenStreets?: string;

  @IsOptional()
  @IsString()
  shippingNeighborhood?: string;

  @IsOptional()
  @IsString()
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  shippingContactPhone?: string;

  @IsOptional()
  @IsString()
  shippingReference?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // Optional amounts (server may calculate these but accept overrides)
  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;
}

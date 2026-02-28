import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  ValidateIf,
  IsPositive,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentType } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description:
      'ID de la configuración del producto en la tienda (ProductStore)',
    example: 1,
  })
  productId: number;

  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: 'Cantidad de unidades del producto (debe ser mayor a 0)',
    example: 2,
  })
  quantity: number;
}

/**
 * Clase base para ambos tipos de órdenes.
 * Contiene campos comunes a SHIPPING y PICKUP.
 * NOTA: storeId se obtiene automáticamente del token del usuario autenticado,
 * lo que asegura contexto multititienda y previene acceso no autorizado.
 *
 * IMPORTANTE: El fulfillmentType se valida en las subclases (CreateShippingOrderDto y CreatePickupOrderDto)
 * con @ValidateIf para asegurar que los campos específicos de cada tipo se validen correctamente.
 */
export class CreateOrderBaseDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ApiProperty({
    description: 'Lista de items a incluir en el pedido',
    type: [CreateOrderItemDto],
    isArray: true,
  })
  items: CreateOrderItemDto[];

  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency debe ser un código ISO 4217 válido (ej: USD, EUR, ARS)',
  })
  @ApiProperty({
    description: 'Moneda del pedido (código ISO 4217 de 3 letras)',
    example: 'USD',
    required: false,
  })
  currency: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Método de pago (ej: CARD, PAYPAL, STRIPE)',
    example: 'PAYPAL',
    required: false,
  })
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    description: 'Notas del cliente (máximo 500 caracteres)',
    example: 'Entregar sin sobreempaque',
    required: false,
  })
  customerNotes?: string;
}

/**
 * DTO para órdenes con cumplimiento por ENVÍO (SHIPPING).
 * Requiere todos los campos de dirección de envío completos.
 * Usa @ValidateIf para asegurar que los campos obligatorios se validen correctamente.
 */
export class CreateShippingOrderDto extends CreateOrderBaseDto {
  @IsEnum(FulfillmentType, {
    message: `fulfillmentType debe ser: ${FulfillmentType.SHIPPING}`,
  })
  @IsNotEmpty({ message: 'fulfillmentType es requerido' })
  @ApiProperty({
    enum: FulfillmentType,
    description: 'Tipo de cumplimiento: SHIPPING (envío)',
    example: FulfillmentType.SHIPPING,
  })
  fulfillmentType: FulfillmentType.SHIPPING;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsString()
  @IsNotEmpty({
    message: 'shippingProvince es requerido para órdenes SHIPPING',
  })
  @ApiProperty({
    description: 'Provincia o estado para envío (requerido para SHIPPING)',
    example: 'Buenos Aires',
  })
  shippingProvince?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({
    message: 'shippingMunicipality es requerido para órdenes SHIPPING',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({
    description: 'Municipio o ciudad para envío (requerido para SHIPPING)',
    example: 'La Plata',
  })
  shippingMunicipality?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({
    message: 'shippingFirstName es requerido para órdenes SHIPPING',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Primer nombre del destinatario (requerido para SHIPPING)',
    example: 'Juan',
  })
  shippingFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Segundo nombre del destinatario',
    example: 'Carlos',
    required: false,
  })
  shippingMiddleName?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({
    message: 'shippingLastName es requerido para órdenes SHIPPING',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Primer apellido del destinatario (requerido para SHIPPING)',
    example: 'Pérez',
  })
  shippingLastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    description: 'Segundo apellido del destinatario',
    example: 'García',
    required: false,
  })
  shippingSecondLastName?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({ message: 'shippingStreet es requerido para órdenes SHIPPING' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @ApiProperty({
    description: 'Calle de dirección de envío (requerido para SHIPPING)',
    example: 'Avenida Siempreviva',
  })
  shippingStreet?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({ message: 'shippingNumber es requerido para órdenes SHIPPING' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @ApiProperty({
    description: 'Número de dirección (requerido para SHIPPING)',
    example: '123',
  })
  shippingNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @ApiProperty({
    description: 'Apartamento o unidad',
    example: '4B',
    required: false,
  })
  shippingApartment?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @ApiProperty({
    description: 'Piso',
    example: '4',
    required: false,
  })
  shippingFloor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'Entre qué calles se encuentra',
    example: 'Entre Calle 1 y Calle 2',
    required: false,
  })
  shippingBetweenStreets?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @ApiProperty({
    description: 'Barrio o zona',
    example: 'Centro',
    required: false,
  })
  shippingNeighborhood?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @ApiProperty({
    description: 'Código postal',
    example: '1900',
    required: false,
  })
  shippingPostalCode?: string;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.SHIPPING)
  @IsNotEmpty({
    message: 'shippingContactPhone es requerido para órdenes SHIPPING',
  })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[\+]?[0-9\-\s]+$/, {
    message:
      'shippingContactPhone debe ser un teléfono válido (ej: +54911234567 o 1123456789)',
  })
  @ApiProperty({
    description: 'Teléfono de contacto para envío (requerido para SHIPPING)',
    example: '+54911234567',
  })
  shippingContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    description: 'Referencias adicionales para el envío',
    example: 'Llamar 5 minutos antes de llegar',
    required: false,
  })
  shippingReference?: string;
}

/**
 * DTO para órdenes con cumplimiento por RETIRO (PICKUP).
 * Requiere un punto de retiro válido.
 */
export class CreatePickupOrderDto extends CreateOrderBaseDto {
  @IsEnum(FulfillmentType, {
    message: `fulfillmentType debe ser: ${FulfillmentType.PICKUP}`,
  })
  @IsNotEmpty({ message: 'fulfillmentType es requerido' })
  @ApiProperty({
    enum: FulfillmentType,
    description: 'Tipo de cumplimiento: PICKUP (retiro)',
    example: FulfillmentType.PICKUP,
  })
  fulfillmentType: FulfillmentType.PICKUP;

  @ValidateIf((o) => o.fulfillmentType === FulfillmentType.PICKUP)
  @IsNotEmpty({ message: 'pickupPointId es requerido para órdenes PICKUP' })
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: 'ID del punto de retiro (requerido para PICKUP)',
    example: 1,
  })
  pickupPointId?: number;
}

/**
 * Union type que permite aceptar ambos tipos de órdenes en el controlador.
 */
export type CreateOrderDto = CreateShippingOrderDto | CreatePickupOrderDto;

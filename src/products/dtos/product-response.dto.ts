import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ProductDto {
  @ApiProperty({ example: 6, description: 'ID del producto' })
  @Expose({ groups: ['public', 'customer', 'admin'] })
  id: number;

  @ApiProperty({
    example: 'SKU123',
    description: 'SKU del producto',
    required: false,
  })
  @Expose({ groups: ['admin'] })
  sku?: string | null;

  @ApiProperty({
    example: 'HORNO MICROONDAS 20L ALL NOVU',
    description: 'Nombre del producto',
  })
  @Expose({ groups: ['public', 'customer', 'admin'] })
  name: string;

  @ApiProperty({ example: 75.0, description: 'Precio de venta' })
  @Expose({ groups: ['public', 'customer', 'admin'] })
  price: number;

  @ApiProperty({
    example: 12345,
    description: 'ID externo (si existe)',
    required: false,
  })
  @Expose({ groups: ['admin'] })
  externalId?: number | null;

  @ApiProperty({
    example: '<p>Resumen</p>',
    description: 'Resumen (HTML)',
    required: false,
  })
  @Expose({ groups: ['public', 'customer', 'admin'] })
  summary?: string | null;

  @ApiProperty({
    example: '<p>Observaciones</p>',
    description: 'Observaciones (HTML)',
    required: false,
  })
  @Expose({ groups: ['public', 'customer', 'admin'] })
  observations?: string | null;

  @ApiProperty({ example: 'external', description: 'Origen del producto' })
  @Expose({ groups: ['admin'] })
  source: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el producto fue importado en la BD local',
  })
  @Expose({ groups: ['admin'] })
  isImported: boolean;

  @ApiProperty({
    example: { foo: 'bar' },
    description: 'Payload original (rawData)',
    required: false,
  })
  @Expose({ groups: ['admin'] })
  rawData?: any | null;

  @ApiProperty({
    example: '2023-01-01T12:00:00.000Z',
    description: 'Fecha de mapeo',
    required: false,
  })
  @Expose({ groups: ['admin'] })
  mappedAt?: Date | null;
}

export class ProductListDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'HORNO MICROONDAS 20L ALL NOVU',
    description: 'Nombre del producto',
  })
  @Expose()
  name: string;

  @ApiProperty({ example: 74.99, description: 'Precio de venta' })
  @Expose()
  @Transform(({ value }) => Number(value) || 0)
  price: number;
}

// DTO para la vista pública (los campos visibles para usuarios anónimos/cliente)
export class ProductPublicDto extends PickType(ProductDto, [
  'id',
  'name',
  'price',
  'summary',
  'observations',
] as const) {}

// DTO para la vista admin (extiende ProductDto — incluye todos los campos ya documentados)
export class ProductAdminDto extends ProductDto {}

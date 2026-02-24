import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

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
export class ProductPublicDto extends ProductListDto {
  @ApiProperty({
    example: '<p>Resumen</p>',
    description: 'Resumen (HTML)',
    required: false,
  })
  @Expose()
  summary: string;

  @ApiProperty({
    example: '<p>Observaciones</p>',
    description: 'Observaciones (HTML)',
    required: false,
  })
  @Expose()
  observations: string;
}

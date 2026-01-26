import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductInCartDto {
  @ApiProperty({ example: 6, description: 'ID del producto' })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'HORNO MICROONDAS 20L ALL NOVU',
    description: 'Nombre del producto',
  })
  @Expose()
  name: string;
}

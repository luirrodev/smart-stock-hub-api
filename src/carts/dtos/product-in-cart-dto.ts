import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ProductStore } from '../../products/entities/product-store.entity';

/**
 * DTO para mostrar el producto en el carrito
 * NOTA: Aunque internamente usamos ProductStore,
 * lo exponemos como 'product' para mantener compatibilidad con el cliente
 */
export class ProductInCartDto {
  @ApiProperty({
    example: 6,
    description: 'ID de la configuración del producto en la tienda',
  })
  @Expose()
  productStoreId: number;

  @ApiProperty({
    example: 'HORNO MICROONDAS 20L ALL NOVU',
    description: 'Nombre del producto',
  })
  @Expose()
  @Transform(({ obj }: { obj: ProductStore }) => obj.name)
  name: string;
}

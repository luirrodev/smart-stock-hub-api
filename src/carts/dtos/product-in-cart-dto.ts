import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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
  id: number;

  @ApiProperty({
    example: 'HORNO MICROONDAS 20L ALL NOVU',
    description: 'Nombre del producto',
  })
  @Expose()
  name: string;
}

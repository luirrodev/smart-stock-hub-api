import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para agregar un producto al carrito
 * Solo contiene los datos del producto a agregar
 *
 * Los datos de contexto (storeId, storeUserId, sessionId) se extraen del:
 * - JWT token (storeId, storeUserId)
 * - Query string (sessionId)
 */
export class AddToCartDto {
  @ApiProperty({ description: 'ID interno del producto', example: 123 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Cantidad a añadir', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

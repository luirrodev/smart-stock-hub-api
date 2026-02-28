import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query parameters para endpoints de carrito
 * Estos parámetros se detectan automáticamente en Swagger desde los decoradores @ApiPropertyOptional
 */
export class CartQueryDto {
  @ApiPropertyOptional({
    description:
      'ID de sesión para usuarios invitados (UUID). Debe viajar en query string. Si no se incluye y el usuario NO está autenticado, el backend generará uno automáticamente.',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string | null;
}

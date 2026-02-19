import { BadRequestException } from '@nestjs/common';
import { PayloadToken } from '../../auth/models/token.model';

/**
 * Valida que el usuario tiene contexto de tienda válido en el token
 * Necesario para operaciones en ambiente multitienda
 * @param user - Token del usuario autenticado
 * @throws BadRequestException si falta storeId o storeUserId
 */
export function validateUserStoreContext(user: PayloadToken) {
  if (!user.storeId) {
    throw new BadRequestException(
      'El token no contiene storeId. No se puede realizar la operación sin contexto de tienda.',
    );
  }

  if (!user.storeUserId) {
    throw new BadRequestException(
      'El token no contiene storeUserId. El usuario debe estar autenticado en el contexto de una tienda.',
    );
  }

  return {
    storeId: user.storeId,
    storeUserId: user.storeUserId,
  };
}

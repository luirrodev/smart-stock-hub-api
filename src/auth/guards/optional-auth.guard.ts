import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Llamar al método padre pero capturar cualquier error
    // Siempre retorna true para permitir que la request continúe
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Ignorar cualquier error (token inválido, expirado, etc.)
    // Si hay usuario válido, lo retorna; sino retorna null
    // Esto permite que el endpoint sea accesible sin autenticación
    return user || null;
  }
}

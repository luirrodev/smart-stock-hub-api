import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Siempre permite el acceso
    return true;
  }

  handleRequest(err, user, info, context) {
    // Si hay usuario, lo retorna
    // Si no hay usuario (sin token), retorna null
    // NO lanza error en ningún caso
    return user || null;
  }
}

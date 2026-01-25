import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_KEY } from '../decorators/optional-auth.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JWTAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es pública o es 'optional auth', permitir acceso y dejar que
    // un guard opcional maneje la autenticación si se desea.
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isOptional) {
      return true;
    }

    // Si no es pública ni opcional, aplicar validación JWT normal
    return super.canActivate(context);
  }
  handleRequest(err, user, info) {
    // Si hay un error o no hay usuario (token inválido)
    if (err || !user) {
      let errorMessage = 'You need to authenticate to access this resource';

      // Personalizar el mensaje según el tipo de error
      if (info) {
        if (info.name === 'TokenExpiredError') {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (info.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid authentication token';
        }
      }

      throw new UnauthorizedException(errorMessage);
    }
    return user;
  }
}

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JWTAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Podemos añadir lógica personalizada aquí si es necesario
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

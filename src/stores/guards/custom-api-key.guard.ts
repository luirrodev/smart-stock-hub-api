import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { StoresService } from '../services/stores.service';

@Injectable()
export class CustomApiKeyGuard implements CanActivate {
  constructor(private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const user = request.user;

    // Determine if X-API-Key is required based on context
    // - For register (no user): X-API-Key is REQUIRED
    // - For login with CUSTOMER: X-API-Key is REQUIRED
    // - For login with STAFF: X-API-Key is OPTIONAL
    const isApiKeyRequired = !user || (user && user.role?.name === 'customer');

    if (!apiKey) {
      // If X-API-Key is required but not provided, throw error
      if (isApiKeyRequired) {
        const errorMessage = user
          ? 'X-API-Key header is required for customer login'
          : 'API-KEY es requerido en el header X-API-Key';

        const exceptionClass = user
          ? BadRequestException
          : UnauthorizedException;
        throw new exceptionClass(errorMessage);
      }
      // If X-API-Key is optional (STAFF login) and not provided, allow pass
      return true;
    }

    // If X-API-Key is provided, validate that it exists
    const store = await this.storesService.findByApiKey(apiKey);
    if (!store) {
      throw new UnauthorizedException('API-KEY inválida');
    }

    // Populate request.store for use in controller
    request.store = store;
    return true;
  }
}

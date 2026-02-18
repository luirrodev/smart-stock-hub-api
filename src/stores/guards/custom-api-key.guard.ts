import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { StoresService } from '../services/stores.service';

@Injectable()
export class CustomApiKeyGuard implements CanActivate {
  constructor(private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    // X-API-Key is ALWAYS required
    if (!apiKey) {
      throw new UnauthorizedException('X-API-Key header is required');
    }

    // Validate that the API-Key exists and is valid
    const store = await this.storesService.findByApiKey(apiKey);
    if (!store) {
      throw new UnauthorizedException('Invalid X-API-Key');
    }

    // Populate request.store for use in LocalStrategy and Controller
    request.store = store;
    return true;
  }
}

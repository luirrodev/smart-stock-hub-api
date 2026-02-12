import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { StoresService } from '../services/stores.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        'API-KEY es requerido en el header X-API-Key',
      );
    }

    const store = await this.storesService.findByApiKey(apiKey as string);
    if (!store) {
      throw new UnauthorizedException('API-KEY inválida');
    }

    // Attachar store al request para componentes posteriores
    request.store = store;
    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { StoresService } from 'src/stores/services/stores.service';

/**
 * Guard for validating apiKey from query parameter
 * Used specifically for Google OAuth endpoints where headers cannot be passed
 */
@Injectable()
export class GoogleApiKeyGuard implements CanActivate {
  constructor(private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.query?.apiKey as string | undefined;

    // apiKey query parameter is required for Google OAuth flow
    if (!apiKey) {
      throw new UnauthorizedException('apiKey query parameter is required');
    }

    // Validate that the API-Key exists and is valid
    const store = await this.storesService.findByApiKey(apiKey);

    // Populate request.store for GoogleAuthGuard to use in state parameter
    request.store = store;
    return true;
  }
}

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const store = request.store;

    // Encode storeId in state parameter for OAuth flow
    const state = store?.id
      ? Buffer.from(JSON.stringify({ storeId: store.id })).toString('base64')
      : undefined;

    return {
      state,
      accessType: 'offline',
      prompt: 'consent',
    };
  }
}

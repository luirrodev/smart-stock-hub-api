import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StoreUser } from '../../access-control/users/entities/store-user.entity';

@Injectable()
export class StoreCustomerContextGuard implements CanActivate {
  constructor(
    @InjectRepository(StoreUser)
    private storeUsersRepository: Repository<StoreUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // For STAFF users (role != 'customer'):
    // Store context is optional, comes from route params or request
    if (user.role && user.role !== 'customer') {
      const storeId = parseInt(request.params.storeId, 10);
      if (storeId && !isNaN(storeId)) {
        // Validate staff has access to this store (if needed, check against permissions)
        // For now, just attach the store context to the request
        request['storeId'] = storeId;
      }
      return true;
    }

    // For CUSTOMER users (role === 'customer'):
    // Store context is REQUIRED in the token
    if (!user.storeId || !user.storeUserId) {
      throw new ForbiddenException(
        'Customer token requires store context (storeId and storeUserId)',
      );
    }

    // Validate customer has active access to the store
    const storeUser = await this.storeUsersRepository.findOne({
      where: { id: user.storeUserId, storeId: user.storeId },
    });

    if (!storeUser || !storeUser.isActive) {
      throw new ForbiddenException(
        'Customer does not have active access to this store',
      );
    }

    // Attach store user context to request for downstream use
    request['storeUser'] = storeUser;
    request['storeId'] = user.storeId;

    return true;
  }
}

// Augment Express Request type to support store context injection
declare global {
  namespace Express {
    interface Request {
      storeUser?: {
        id: number;
        customerId: number;
        storeId: number;
        isActive: boolean;
      };
      storeId?: number;
    }
  }
}

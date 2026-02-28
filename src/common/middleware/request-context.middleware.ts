import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private requestContextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    const userId = (req.user as any)?.['sub'] || (req.user as any)?.['userId'];
    const storeId =
      (req.user as any)?.['storeId'] || (req.store as any)?.['id'];

    const forwarded = req.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';

    (req as any).requestId = requestId;

    this.requestContextService.run(
      {
        requestId,
        userId: userId ? Number(userId) : undefined,
        storeId: storeId ? Number(storeId) : undefined,
        ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date(),
      },
      () => next(),
    );
  }
}

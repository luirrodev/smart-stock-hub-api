import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance, instanceToPlain } from 'class-transformer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Determinar grupos según el rol del usuario
        let groups = ['public'];

        if (user) {
          if (user.role === 'admin') {
            groups = ['admin'];
          } else if (user.role === 'customer') {
            groups = ['customer'];
          }
        }

        // Convertir la entidad TypeORM a objeto plano primero
        const plainData = instanceToPlain(data);

        // Luego convertir a la clase DTO con los grupos
        const instance = plainToInstance(this.dto, plainData, {
          groups,
        });

        // Finalmente convertir a plain object con los grupos
        const result = instanceToPlain(instance, {
          groups,
          excludeExtraneousValues: true,
        });

        return result;
      }),
    );
  }
}

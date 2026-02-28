import {
  Injectable,
  PipeTransform,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateOrderDto,
  CreateShippingOrderDto,
  CreatePickupOrderDto,
} from '../dtos/create-order.dto';
import { FulfillmentType } from '../entities/order.entity';

/**
 * Custom validation pipe que valida dinámicamente el DTO correcto basándose en fulfillmentType.
 *
 * Como CreateOrderDto es un Union type de TypeScript, NestJS no puede validarlo automáticamente.
 * Este pipe:
 * 1. Verifica el fulfillmentType en el payload
 * 2. Elige el DTO correcto (CreateShippingOrderDto o CreatePickupOrderDto)
 * 3. Valida contra ese DTO específico
 * 4. Retorna el objeto validado
 */
@Injectable()
export class ValidateOrderDtoPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    // Verificar que fulfillmentType existe
    if (!value.fulfillmentType) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Bad Request',
        error: {
          fulfillmentType: 'fulfillmentType es requerido',
        },
      });
    }

    // Elegir el DTO correcto basándose en fulfillmentType
    let dtoClass: typeof CreateShippingOrderDto | typeof CreatePickupOrderDto;

    if (value.fulfillmentType === FulfillmentType.SHIPPING) {
      dtoClass = CreateShippingOrderDto;
    } else if (value.fulfillmentType === FulfillmentType.PICKUP) {
      dtoClass = CreatePickupOrderDto;
    } else {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Bad Request',
        error: {
          fulfillmentType: `fulfillmentType debe ser uno de: ${Object.values(FulfillmentType).join(', ')}`,
        },
      });
    }

    // Transformar el payload al DTO correcto
    const dtoInstance = plainToInstance(dtoClass as any, value);

    // Validar el DTO
    const errors = await validate(dtoInstance, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      // Formatear errores en un objeto más legible
      const formattedErrors: Record<string, any> = {};

      errors.forEach((error) => {
        if (error.constraints) {
          formattedErrors[error.property] = Object.values(error.constraints)[0];
        } else if (error.children && error.children.length > 0) {
          // Para arrays nested (como items)
          formattedErrors[error.property] = error.children.map((child) => {
            const childErrors: Record<string, any> = {};
            if (child.constraints) {
              Object.entries(child.constraints).forEach(([key, value]) => {
                childErrors[key] = value;
              });
            }
            return childErrors;
          });
        }
      });

      throw new BadRequestException({
        statusCode: 400,
        message: 'Bad Request',
        error: formattedErrors,
      });
    }

    return dtoInstance;
  }
}

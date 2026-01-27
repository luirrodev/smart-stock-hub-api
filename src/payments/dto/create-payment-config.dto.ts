import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import {
  PaymentProvider,
  PaymentMode,
} from '../entities/store-payment-config.entity';

export class CreatePaymentConfigDto {
  // Nombre del proveedor (ej. 'paypal')
  @ApiProperty({ example: PaymentProvider.PAYPAL })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  // Client ID público proporcionado por el proveedor
  @ApiProperty({ example: 'YOUR-CLIENT-ID' })
  @IsString()
  clientId: string;

  // Secret cifrado (texto en claro aquí para el DTO; almacenar en DB encriptado)
  @ApiProperty({ description: 'Proveedor secret (se almacenará encriptado)' })
  @IsString()
  secret: string;

  // Modo: 'sandbox' o 'production'
  @ApiProperty({ enum: PaymentMode, example: PaymentMode.SANDBOX })
  @IsEnum(PaymentMode)
  mode: PaymentMode;

  // Indica si la configuración está activa
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // URL de webhook donde el proveedor enviará notificaciones
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export enum PaypalWebhookEventType {
  PAYMENT_CAPTURE_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED = 'PAYMENT.CAPTURE.DENIED',
  CHECKOUT_ORDER_APPROVED = 'CHECKOUT.ORDER.APPROVED',
  PAYMENT_CAPTURE_REFUNDED = 'PAYMENT.CAPTURE.REFUNDED',
}

/**
 * Payload de webhook de PayPal (simplificado).
 * event_type: uno de los eventos críticos que manejamos.
 * resource: payload específico del evento (id, estado, monto, etc).
 */
export class PaypalWebhookEventDto {
  @ApiProperty({
    example: PaypalWebhookEventType.PAYMENT_CAPTURE_COMPLETED,
    description:
      'Tipo de evento de PayPal. Tipos críticos manejados: ' +
      'PAYMENT.CAPTURE.COMPLETED (marcar pago COMPLETED, orden PAID), ' +
      'PAYMENT.CAPTURE.DENIED (marcar pago FAILED), ' +
      'CHECKOUT.ORDER.APPROVED (orden aprobada), ' +
      'PAYMENT.CAPTURE.REFUNDED (marcar pago REFUNDED, actualizar orden).',
    enum: Object.values(PaypalWebhookEventType),
  })
  @IsString()
  @IsIn(Object.values(PaypalWebhookEventType))
  event_type: PaypalWebhookEventType;

  @ApiProperty({
    example: { id: '...', status: 'COMPLETED', amount: { value: '10.00' } },
    description: 'Payload asociado al evento (varía según event_type).',
  })
  @IsObject()
  resource: Record<string, any>;

  @ApiProperty({ example: '1.0', required: false })
  @IsOptional()
  @IsString()
  api_version?: string;
}

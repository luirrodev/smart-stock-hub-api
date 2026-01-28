import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class PaypalWebhookEventDto {
  @ApiProperty({
    example: 'PAYMENT.SALE.COMPLETED',
    description: 'Tipo de evento de PayPal',
  })
  @IsString()
  event_type: string;

  @ApiProperty({
    example: { id: '...', status: 'COMPLETED' },
    description: 'Payload asociado al evento',
  })
  @IsObject()
  resource: Record<string, any>;

  @ApiProperty({ example: '1.0', required: false })
  @IsOptional()
  @IsString()
  api_version?: string;
}

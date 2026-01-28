import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class StripeWebhookEventDto {
  @ApiProperty({
    example: 'payment_intent.succeeded',
    description: 'Tipo de evento de Stripe',
  })
  @IsString()
  type: string;

  @ApiProperty({
    example: { id: 'pi_123', amount: 1000 },
    description: 'Objeto de datos del evento',
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({ example: 'evt_123', required: false })
  @IsOptional()
  @IsString()
  id?: string;
}

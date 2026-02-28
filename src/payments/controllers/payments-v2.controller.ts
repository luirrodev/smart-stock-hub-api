import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  PaginationDto,
  PaginatedResponse,
} from 'src/common/dtos/pagination.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '2',
})
export class PaymentsV2Controller {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Procesar reembolso de pagos (total o parcial)
   */
  @Post('/refund/:paymentId')
  @RequirePermissions('payments:refunds')
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Procesar reembolso (total o parcial)' })
  @ApiParam({ name: 'paymentId', required: true, description: 'ID del pago' })
  async refundPayment(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: RefundPaymentDto,
  ) {
    return await this.paymentsService.refundPayment(paymentId, dto);
  }

  /**
   * Listar pagos con paginación
   */
  @Get()
  @ApiOperation({
    summary: 'Listar pagos con paginación',
    description:
      'Obtiene una lista paginada de pagos. Soporta búsqueda por ID o ID de orden del proveedor, y ordenamiento por diferentes campos.',
  })
  @ApiOkResponse({
    description: 'Lista de pagos paginada',
    type: PaginatedResponse<PaymentResponseDto>,
  })
  @RequirePermissions('payments:view')
  @UseGuards(PermissionsGuard)
  async getAllPayments(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<PaymentResponseDto>> {
    return await this.paymentsService.getAllPayments(paginationDto);
  }
}

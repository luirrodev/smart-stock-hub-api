export class RefundPaymentDto {
  // Monto a reembolsar. Si no se provee, se intentará reembolsar el total.
  amount?: string;

  // Motivo del reembolso (opcional)
  reason?: string;
}

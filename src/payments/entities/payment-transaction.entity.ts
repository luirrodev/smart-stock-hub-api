import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum TransactionType {
  CREATE = 'CREATE',
  CAPTURE = 'CAPTURE',
  REFUND = 'REFUND',
  WEBHOOK = 'WEBHOOK',
}

@Entity({ name: 'payment_transactions' })
export class PaymentTransaction {
  // Clave primaria del registro de transacción
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON PAYMENT
  // Pago al que pertenece esta transacción (referencia a payments.id)
  @ManyToOne(() => Payment, { nullable: false })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  // Clave foránea que referencia a payments.id
  @Column({ name: 'payment_id' })
  paymentId: number;

  // TIPO DE TRANSACCIÓN
  // Tipo de interacción con el proveedor: CREATE, CAPTURE, REFUND, WEBHOOK
  @Column({ name: 'transaction_type', type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  // ID DE TRANSACCIÓN DEL PROVEEDOR
  // Identificador que el proveedor asignó a la operación (si aplica)
  @Column({
    name: 'provider_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerTransactionId?: string | null;

  // PAYLOAD DE REQUEST
  // JSON con el payload enviado al proveedor (puede incluir datos de la solicitud como body, headers, etc.)
  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload?: Record<string, any> | null;

  // PAYLOAD DE RESPONSE
  // JSON con la respuesta recibida del proveedor (se guarda para auditoría y debugging)
  @Column({ name: 'response_payload', type: 'jsonb', nullable: true })
  responsePayload?: Record<string, any> | null;

  // ESTADO
  // Estado del resultado de esta interacción (ej. 'SUCCESS', 'ERROR', 'PENDING') — el contenido es libre para permitir distintos proveedores.
  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
